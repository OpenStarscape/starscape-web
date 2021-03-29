import * as THREE from "three";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3 } from "../core";
import { SsObject } from "../protocol";
import type { BodySpatial } from './Body'

const emptyGeom = new THREE.BufferGeometry();
const circleGeom = new THREE.CircleGeometry(1, 120);
circleGeom.vertices.shift(); // Remove center vertex
const yVec = new THREE.Vector3(0, 1, 0);
const zVec = new THREE.Vector3(0, 0, 1);

/// The parent class for all 3D body types.
export class BodyVisual extends Lifetime {
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
  protected readonly mesh = new THREE.Mesh(emptyGeom, this.wireMat);

  constructor(
    readonly scene: THREE.Scene,
    readonly obj: SsObject,
    name: string | null,
    color: string,
    readonly spatial: BodySpatial,
  ) {
    super();

    this.add(this.solidMat);
    this.add(this.wireMat);
    this.add(this.lineMat);

    // This is probs a better way: https://stackoverflow.com/a/21742175
    this.orbitLine = new THREE.LineLoop(circleGeom, this.lineMat);

    this.scene.add(this.mesh);
    this.scene.add(this.orbitLine);
    this.addCallback(() => {
      this.scene.remove(this.mesh);
      this.scene.remove(this.orbitLine);
    });

    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'body-label';
    this.labelDiv.style.marginTop = '1em';
    this.label = new CSS2DObject(this.labelDiv);
    this.label.visible = false;
    this.mesh.add(this.label);

    this.setName(name);
    this.setColor(color);
  }

  // Sets the color using a Starscape protocol color (starts with 0x...)
  protected setColor(color: string) {
    color = '#' + color.slice(2);
    this.wireMat.color.setStyle(color);
    this.solidMat.color.setStyle(color);
    this.lineMat.color.setStyle(color);
    this.labelDiv.style.color = color;
  }

  setName(name: string | null) {
    if (name !== null) {
      this.labelDiv.textContent = name;
      this.label.visible = true;
    } else {
      this.label.visible = false;
    }
  }

  update(cameraPosition: THREE.Vector3) {
    this.spatial.copyPositionInto(this.mesh.position);
    const dist = this.mesh.position.distanceTo(cameraPosition);
    const scale = dist / 100 / this.size;
    if (scale > 1) {
      this.mesh.scale.setScalar(scale);
      this.mesh.material = this.solidMat;
    } else {
      this.mesh.scale.setScalar(1);
      this.mesh.material = this.wireMat;
    }

    const parent = this.spatial.getParent();
    if (this.spatial.isReady() && parent !== null) {
      this.orbitLine.visible = true;
      parent.copyPositionInto(this.orbitLine.position);
      const distance = this.orbitLine.position.distanceTo(this.mesh.position);
      this.orbitLine.scale.setScalar(distance);
      parent.copyPositionInto(this.orbitUp);
      this.orbitUp.sub(this.mesh.position);
      this.spatial.copyVelocityInto(this.velRelToGravBody);
      parent.copyVelocityInto(this.parentVel);
      this.velRelToGravBody.sub(this.parentVel);
      this.orbitUp.cross(this.velRelToGravBody);
      this.orbitUp.normalize();
      this.orbitLine.quaternion.setFromUnitVectors(zVec, this.orbitUp);
    } else {
      this.orbitLine.visible = false;
    }
  }
}

export class CelestialVisual extends BodyVisual {
  constructor(scene: THREE.Scene, obj: SsObject, name: string | null, spatial: BodySpatial) {
    super(scene, obj, name, '0x000000', spatial);
    this.obj.property('color', String).subscribe(this, color => this.setColor(color));
    this.obj.property('size', Number).getThen(this, km => {
      this.size = km * Vec3.threeScale;
      this.mesh.geometry = new THREE.SphereBufferGeometry(this.size, 16, 16);
      this.add(this.mesh.geometry);
    });
  }
}

export class ShipVisual extends BodyVisual {
  private readonly direction = new THREE.Vector3();
  private accel: Vec3 | undefined;

  constructor(scene: THREE.Scene, obj: SsObject, name: string | null, spatial: BodySpatial) {
    super(scene, obj, name, '0xFFFFFF', spatial);
    this.size = 0.01;
    this.mesh.geometry = new THREE.ConeBufferGeometry(0.01, 0.03, 16);
    this.add(this.mesh.geometry);
    this.obj.property('accel', Vec3).subscribe(this, accel => {
      this.accel = accel;
    });
  }

  update(cameraPosition: THREE.Vector3) {
    super.update(cameraPosition);
    if (this.accel !== undefined) {
      this.accel.copyInto(this.direction);
    }
    if (this.direction.lengthSq() < 0.0005 && this.spatial.isReady()) {
      this.spatial.copyVelocityInto(this.direction);
    }
    this.direction.normalize();
    this.mesh.quaternion.setFromUnitVectors(yVec, this.direction);
  }
}
