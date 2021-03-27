import * as THREE from "three";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3 } from "../core";
import { SsObject } from "../protocol";
import type { BodyManager } from './BodyManager'

const emptyGeom = new THREE.BufferGeometry();
const circleGeom = new THREE.CircleGeometry(1, 120);
circleGeom.vertices.shift(); // Remove center vertex
const yVec = new THREE.Vector3(0, 1, 0);
const zVec = new THREE.Vector3(0, 0, 1);

/// The parent class for all 3D body types.
export class Body extends Lifetime {
  /// The body manager subscribes and uses the setters for name and parent
  private name: string | null = null;
  private parent: Body | null = null;

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
  private parentVel = new THREE.Vector3();

  protected size = 1;
  protected readonly getVelocity: () => Vec3 | undefined;
  protected readonly mesh = new THREE.Mesh(emptyGeom, this.wireMat);

  constructor(
    readonly manager: BodyManager,
    readonly scene: THREE.Scene,
    readonly obj: SsObject,
    readonly scale: number,
  ) {
    super();

    this.getMass = this.obj.property('mass', Number).getter(this);
    this.getVelocity = this.obj.property('velocity', Vec3).getter(this);
    this.getRawPos = this.obj.property('position', Vec3).getter(this);
    this.obj.property('grav_parent', {nullable: SsObject}).subscribe(this, parent_obj => {
      this.parent = this.manager.get(parent_obj) ?? null;
    });

    this.add(this.solidMat);
    this.add(this.wireMat);
    this.add(this.lineMat);

    // This is probs a better way: https://stackoverflow.com/a/21742175
    this.orbitLine = new THREE.LineLoop(circleGeom, this.lineMat);

    this.scene.add(this.mesh);
    this.scene.add(this.orbitLine);

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

  copyPositionInto(vec: THREE.Vector3) {
    const raw = this.getRawPos();
    if (raw !== undefined) {
      raw.copyInto(vec, this.scale);
    }
  }

  copyVelocityInto(vec: THREE.Vector3) {
    const raw = this.getVelocity();
    if (raw !== undefined) {
      raw.copyInto(vec, this.scale);
    }
  }

  getPosition() {
    const result = new THREE.Vector3();
    this.copyPositionInto(result);
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
    this.copyPositionInto(this.mesh.position);
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
    const mass = this.getMass();
    if (velocity !== undefined &&
        mass !== undefined &&
        this.parent !== null
    ) {
      this.orbitLine.visible = true;
      this.parent.copyPositionInto(this.orbitLine.position);
      const distance = this.orbitLine.position.distanceTo(this.mesh.position);
      this.orbitLine.scale.setScalar(distance);
      this.parent.copyPositionInto(this.orbitUp);
      this.orbitUp.sub(this.mesh.position);
      velocity.copyInto(this.velRelToGravBody, this.scale);
      this.parent.copyVelocityInto(this.parentVel);
      this.velRelToGravBody.sub(this.parentVel);
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

export class Celestial extends Body {
  constructor(manager: BodyManager, scene: THREE.Scene, obj: SsObject, scale: number) {
    super(manager, scene, obj, scale)
    this.obj.property('color', String).subscribe(this, color => this.setColor(color));
    this.obj.property('size', Number).getThen(this, km => {
      this.size = km * this.scale;
      this.mesh.geometry = new THREE.SphereBufferGeometry(this.size, 16, 16);
      this.add(this.mesh.geometry);
    });
  }
}

export class Ship extends Body {
  private readonly direction = new THREE.Vector3();
  private readonly getAccel: () => Vec3 | undefined;

  constructor(manager: BodyManager, scene: THREE.Scene, obj: SsObject, scale: number) {
    super(manager, scene, obj, scale);
    this.setColor('0xFFFFFF');
    this.size = 0.01;
    this.mesh.geometry = new THREE.ConeBufferGeometry(0.01, 0.03, 16);
    this.add(this.mesh.geometry);
    this.getAccel = this.obj.property('accel', Vec3).getter(this);
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
