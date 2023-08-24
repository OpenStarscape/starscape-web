import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lifetime } from '../core';
import { Spatial } from '../game';
import { SpaceScene } from './SpaceScene';

const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
const tmpVecC = new THREE.Vector3();

/// Keeps track of creating and destroying bodies in the 3D scene.
export class CameraManager {
  readonly cameraController: OrbitControls;
  readonly viewTarget = new THREE.Object3D();
  private targetSpatial: Spatial | null = null;
  private readonly fakeCam;

  constructor(
    readonly lt: Lifetime,
    scene: SpaceScene,
    domElement: HTMLElement,
    readonly camera: THREE.Camera,
  ) {
    scene.addObject(lt, this.viewTarget);
    this.fakeCam = camera.clone();
    this.fakeCam.matrixAutoUpdate = true; // Needed to make things smooth for some reason
    this.cameraController = new OrbitControls(this.fakeCam, domElement);
    this.fakeCam.position.set(20, 20, 10);
    scene.cameraFocusBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
      this.targetSpatial = body ? body.spatial(valueLt) : null;
    });
  }

  update() {
    if (this.targetSpatial !== null) {
      this.targetSpatial.copyPositionInto(this.viewTarget.position);
      tmpVecA.setScalar(0);
      tmpVecB.setScalar(0);
      tmpVecC.setScalar(0);
      const parentSpatial = this.targetSpatial.parent();
      if (parentSpatial) {
        parentSpatial.copyPositionInto(tmpVecA);
        parentSpatial.copyVelocityInto(tmpVecB);
      }
      tmpVecA.sub(this.viewTarget.position);
      // tmpVecA is now relative position of parent
      this.targetSpatial.copyVelocityInto(tmpVecC);
      tmpVecC.sub(tmpVecB);
      // tmpVecC is now relative velocity of target
      tmpVecB.copy(tmpVecC);
      tmpVecB.cross(tmpVecA);
      // tmpVecB is now direction perpendicular to these
      tmpVecC.copy(tmpVecB);
      tmpVecC.cross(tmpVecA);
      // tmpVecC is now perpendicular to A and B
      tmpVecA.normalize();
      tmpVecB.normalize();
      tmpVecC.normalize();
      this.viewTarget.matrix.makeBasis(tmpVecA, tmpVecC, tmpVecB);
      this.viewTarget.quaternion.setFromRotationMatrix(this.viewTarget.matrix);
      this.viewTarget.quaternion.normalize();
      this.viewTarget.updateMatrix();
    }
    // TODO: allow panning by slowely moving target back to origin
    this.cameraController.target.set(0, 0, 0);
    this.cameraController.update();
    this.viewTarget.updateMatrix();
    this.viewTarget.updateMatrixWorld();
    this.camera.position.copy(this.fakeCam.position);
    this.camera.quaternion.copy(this.fakeCam.quaternion);
    this.camera.position.applyMatrix4(this.viewTarget.matrix);
    this.camera.quaternion.premultiply(this.viewTarget.quaternion);
    this.camera.updateMatrix();
    this.camera.updateMatrixWorld();
  }
}
