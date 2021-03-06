import * as THREE from "three";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3 } from "../core";
import { SsObject } from "../protocol";

const emptyGeom = new THREE.BufferGeometry();
const circleGeom = new THREE.CircleGeometry(1, 120);
circleGeom.vertices.shift(); // Remove center vertex
const yVec = new THREE.Vector3(0, 1, 0);
const zVec = new THREE.Vector3(0, 0, 1);

/// The parent class for all 3D body types.
export class Body {
  /// Instead of us subscribing, the manager subscribes and uses the setter
  private name: string | null = null;
  private readonly getMass: () => number | undefined;
  private readonly getRawPos: () => Vec3 | undefined;
  private readonly orbitLine: THREE.LineLoop;
  private readonly labelDiv: HTMLDivElement;
  private readonly label: CSS2DObject;

  // These need to be added to the lifetime
  private readonly solidMat = new THREE.MeshBasicMaterial({color: 'white'});
  private readonly wireMat = new THREE.MeshBasicMaterial({color: 'white', wireframe: true});
  private readonly lineMat = new THREE.LineBasicMaterial({color: 'white'});

  // These do not
  private orbitUp = new THREE.Vector3();
  private velRelToGravBody = new THREE.Vector3();
  private gravBodyLt: Lifetime | null = null;
  private getGravBodyPos: () => Vec3 | undefined = () => undefined;
  private getGravBodyVel: () => Vec3 | undefined = () => undefined;
  private getGravBodyMass: () => number | undefined = () => undefined;

  protected size = 1;
  protected readonly getVelocity: () => Vec3 | undefined;
  protected readonly mesh = new THREE.Mesh(emptyGeom, this.wireMat);

  constructor(
    readonly lt: Lifetime,
    readonly scene: THREE.Scene,
    readonly obj: SsObject,
    readonly scale: number,
  ) {
    this.getMass = this.obj.property('mass', Number).getter(this.lt);
    this.getVelocity = this.obj.property('velocity', Vec3).getter(this.lt);
    this.getRawPos = this.obj.property('position', Vec3).getter(this.lt);

    this.lt.add(this.solidMat);
    this.lt.add(this.wireMat);
    this.lt.add(this.lineMat);

    // This is probs a better way: https://stackoverflow.com/a/21742175
    this.orbitLine = new THREE.LineLoop(circleGeom, this.lineMat);

    this.scene.add(this.mesh);
    this.scene.add(this.orbitLine);

    this.setGravBody(null);
    this.obj.property('grav_parent', {nullable: SsObject}).subscribe(this.lt, grav_parent => {
      this.setGravBody(grav_parent);
    });

    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'body-label';
    this.labelDiv.style.marginTop = '1em';
    this.label = new CSS2DObject(this.labelDiv);
    this.label.visible = false;
    this.mesh.add(this.label);
  }

  isShip() {
    return false;
  }

  setGravBody(gravBody: SsObject | null) {
    // this.gravBodyLt is only used directly by this function. It gets recreated every time the
    // gravity body changes.
    if (this.gravBodyLt) {
      this.lt.disposeOf(this.gravBodyLt);
    }
    if (gravBody !== null) {
      this.gravBodyLt = new Lifetime();
      this.lt.add(this.gravBodyLt)
      this.getGravBodyPos = gravBody.property('position', Vec3).getter(this.gravBodyLt);
      this.getGravBodyVel = gravBody.property('velocity', Vec3).getter(this.gravBodyLt);
      this.getGravBodyMass = gravBody.property('mass', Number).getter(this.gravBodyLt);
    } else {
      this.gravBodyLt = null;
      this.getGravBodyPos = () => undefined;
      this.getGravBodyVel = () => undefined;
      this.getGravBodyMass = () => undefined;
    }
  }

  setToPosition(vec: THREE.Vector3) {
    const raw = this.getRawPos();
    if (raw !== undefined) {
      raw.copyInto(vec, this.scale);
    }
  }

  getPosition() {
    const result = new THREE.Vector3();
    this.setToPosition(result);
    return result;
  }

  setColor(color: string) {
    if (!color) {
      color = '#FFFFFF';
    } else {
      color = '#' + color.slice(2);
    }
    this.wireMat.color.setStyle(color);
    this.solidMat.color.setStyle(color);
    this.lineMat.color.setStyle(color);
    this.labelDiv.style.color = color;
  }

  getName() {
    return this.name;
  }

  setName(name: string | null) {
    this.name = name;
    if (name !== null) {
      this.labelDiv.textContent = name;
      this.label.visible = true;
    } else {
      this.label.visible = false;
    }
  }

  update(cameraPosition: THREE.Vector3) {
    this.setToPosition(this.mesh.position);
    const dist = this.mesh.position.distanceTo(cameraPosition);
    const scale = dist / 100 / this.size;
    if (scale > 1) {
      this.mesh.scale.setScalar(scale);
      this.mesh.material = this.solidMat;
    } else {
      this.mesh.scale.setScalar(1);
      this.mesh.material = this.wireMat;
    }

    const velocity = this.getVelocity();
    const gravBodyPos = this.getGravBodyPos();
    const gravBodyVel = this.getGravBodyVel();
    const gravBodyMass = this.getGravBodyMass();
    const mass = this.getMass();
    if (velocity !== undefined &&
      gravBodyPos !== undefined &&
      gravBodyVel !== undefined &&
      gravBodyMass !== undefined &&
      mass !== undefined &&
      gravBodyMass > mass
    ) {
      this.orbitLine.visible = true;
      gravBodyPos.copyInto(this.orbitLine.position, this.scale);
      const distance = this.orbitLine.position.distanceTo(this.mesh.position);
      this.orbitLine.scale.setScalar(distance);
      gravBodyPos.copyInto(this.orbitUp, this.scale);
      this.orbitUp.sub(this.mesh.position);
      velocity.copyInto(this.velRelToGravBody, this.scale);
      this.velRelToGravBody.sub(gravBodyVel.newThreeVector3(this.scale));
      this.orbitUp.cross(this.velRelToGravBody);
      this.orbitUp.normalize();
      this.orbitLine.quaternion.setFromUnitVectors(zVec, this.orbitUp);
    } else {
      this.orbitLine.visible = false;
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

class Celestial extends Body {
  constructor(lifetime: Lifetime, scene: THREE.Scene, obj: SsObject, scale: number) {
    super(lifetime, scene, obj, scale)
    this.obj.property('color', String).subscribe(this.lt, color => this.setColor(color));
    this.obj.property('size', Number).getThen(this.lt, km => {
      this.size = km * this.scale;
      this.mesh.geometry = new THREE.SphereBufferGeometry(this.size, 16, 16);
      this.lt.add(this.mesh.geometry);
    });
  }
}

class Ship extends Body {
  private readonly direction = new THREE.Vector3();
  private readonly getAccel: () => Vec3 | undefined;

  constructor(lifetime: Lifetime, scene: THREE.Scene, obj: SsObject, scale: number) {
    super(lifetime, scene, obj, scale);
    this.setColor('0xFFFFFF');
    this.size = 0.01;
    this.mesh.geometry = new THREE.ConeBufferGeometry(0.01, 0.03, 16);
    this.lt.add(this.mesh.geometry);
    this.getAccel = this.obj.property('accel', Vec3).getter(this.lt);
  }

  isShip() {
    return true;
  }

  update(cameraPosition: THREE.Vector3) {
    super.update(cameraPosition);
    const accel = this.getAccel();
    if (accel !== undefined) {
      accel.copyInto(this.direction, this.scale);
    }
    const velocity = this.getVelocity();
    if (this.direction.lengthSq() < 0.0005 && velocity !== undefined) {
      velocity.copyInto(this.direction, this.scale);
    }
    this.direction.normalize();
    this.mesh.quaternion.setFromUnitVectors(yVec, this.direction);
  }
}

export function makeBody(
  lifetime: Lifetime,
  scene: THREE.Scene,
  obj: SsObject,
  scale: number,
  callback: (body: Body) => void
) {
  obj.property('class', String).getThen(lifetime, cls => {
    if (cls === 'celestial') {
      callback(new Celestial(lifetime, scene, obj, scale));
    } else if (cls === 'ship') {
      callback(new Ship(lifetime, scene, obj, scale));
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
