import * as THREE from "three";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Lifetime from "../lib/Lifetime";
import {StarscapeObject} from "../lib/Starscape";

const emptyGeom = new THREE.BufferGeometry();
const circleGeom = new THREE.CircleGeometry(1, 120);
circleGeom.vertices.shift(); // Remove center vertex
const yVec = new THREE.Vector3(0, 1, 0);
const zVec = new THREE.Vector3(0, 0, 1);
const sceneScale = 1;

/// The parent class for all 3D body types.
export class Body {
  /// Instead of us subscribing, the manager subscribes and uses the setter
  private name: string | null = null;
  private readonly getMass: () => any;
  private readonly getRawPos: () => any;
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
  private getGravBodyPos = () => undefined;
  private getGravBodyVel = () => undefined;
  private getGravBodyMass = () => undefined;

  protected size = 1;
  protected readonly getVelocity: () => any;
  protected readonly mesh = new THREE.Mesh(emptyGeom, this.wireMat);

  constructor(
    readonly lt: Lifetime,
    readonly scene: THREE.Scene,
    readonly obj: StarscapeObject
  ) {
    this.getMass = this.obj.property('mass').getter(this.lt);
    this.getVelocity = this.obj.property('velocity').getter(this.lt);
    this.getRawPos = this.obj.property('position').getter(this.lt);

    this.lt.add(this.solidMat);
    this.lt.add(this.wireMat);
    this.lt.add(this.lineMat);

    // This is probs a better way: https://stackoverflow.com/a/21742175
    this.orbitLine = new THREE.LineLoop(circleGeom, this.lineMat);

    this.scene.add(this.mesh);
    this.scene.add(this.orbitLine);

    this.setGravBody(null);
    this.obj.property('grav_parent').subscribe(this.lt, grav_parent => {
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

  setGravBody(gravBody: StarscapeObject | null) {
    // this.gravBodyLt is only used directly by this function. It gets recreated every time the
    // gravity body changes.
    if (this.gravBodyLt) {
      this.lt.disposeOf(this.gravBodyLt);
    }
    if (gravBody !== null) {
      this.gravBodyLt = new Lifetime();
      this.lt.add(this.gravBodyLt)
      this.getGravBodyPos = gravBody.property('position').getter(this.gravBodyLt);
      this.getGravBodyVel = gravBody.property('velocity').getter(this.gravBodyLt);
      this.getGravBodyMass = gravBody.property('mass').getter(this.gravBodyLt);
    } else {
      this.gravBodyLt = null;
      this.getGravBodyPos = () => undefined;
      this.getGravBodyVel = () => undefined;
      this.getGravBodyMass = () => undefined;
    }
  }

  setToPosition(vec: THREE.Vector3) {
    const raw = this.getRawPos();
    if (raw) {
      vec.copy(this.getRawPos());
      vec.multiplyScalar(sceneScale);
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

    if (this.getVelocity() !== undefined &&
        this.getGravBodyPos() !== undefined &&
        this.getGravBodyVel() !== undefined &&
        this.getGravBodyMass() !== undefined &&
        this.getGravBodyMass()! > this.getMass()) {
      this.orbitLine.visible = true;
      this.orbitLine.position.copy(this.getGravBodyPos()!);
      this.orbitLine.position.multiplyScalar(sceneScale);
      const distance = this.orbitLine.position.distanceTo(this.mesh.position);
      this.orbitLine.scale.setScalar(distance);
      this.orbitUp.copy(this.getGravBodyPos()!);
      this.orbitUp.sub(this.mesh.position);
      this.velRelToGravBody.copy(this.getVelocity());
      this.velRelToGravBody.sub(this.getGravBodyVel()!);
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
  constructor(lifetime: Lifetime, scene: THREE.Scene, obj: StarscapeObject) {
    super(lifetime, scene, obj)
    this.obj.property('color').subscribe(this.lt, color => this.setColor(color));
    this.obj.property('size').getThen(this.lt, km => {
      this.size = km * sceneScale;
      this.mesh.geometry = new THREE.SphereBufferGeometry(this.size, 16, 16);
      this.lt.add(this.mesh.geometry);
    });
  }
}

class Ship extends Body {
  private readonly direction = new THREE.Vector3();
  private readonly getAccel: () => any;

  constructor(lifetime: Lifetime, scene: THREE.Scene, obj: StarscapeObject) {
    super(lifetime, scene, obj);
    this.setColor('0xFFFFFF');
    this.size = 0.01;
    this.mesh.geometry = new THREE.ConeBufferGeometry(0.01, 0.03, 16);
    this.lt.add(this.mesh.geometry);
    this.getAccel = this.obj.property('accel').getter(this.lt);
  }

  isShip() {
    return true;
  }

  update(cameraPosition: THREE.Vector3) {
    super.update(cameraPosition);
    if (this.getAccel() !== undefined) {
      this.direction.copy(this.getAccel());
    }
    if (this.direction.lengthSq() < 0.0005 && this.getVelocity() !== undefined) {
      this.direction.copy(this.getVelocity());
    }
    this.direction.normalize();
    this.mesh.quaternion.setFromUnitVectors(yVec, this.direction);
  }
}

export function makeBody(
  lifetime: Lifetime,
  scene: THREE.Scene,
  obj: StarscapeObject,
  callback: (body: Body) => void
) {
  obj.property('class').getThen(lifetime, cls => {
    if (cls == 'celestial') {
      callback(new Celestial(lifetime, scene, obj));
    } else if (cls == 'ship') {
      callback(new Ship(lifetime, scene, obj));
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
