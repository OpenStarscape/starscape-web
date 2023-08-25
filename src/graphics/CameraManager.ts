import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lifetime } from '../core';
import { Spatial } from '../game';
import { SpaceScene } from './SpaceScene';
import { axisVisualizer } from './debuggingHelpers';

const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
const tmpVecC = new THREE.Vector3();
const tmpQuatA = new THREE.Quaternion();

/// Keeps track of creating and destroying bodies in the 3D scene.
export class CameraManager {
  readonly cameraController: OrbitControls;
  readonly viewTarget = new THREE.Object3D();
  private targetSpatial: Spatial | null = null;
  private prevFocusDir = new THREE.Vector3(0, 1, 0);
  private prevFocusSpatial: Spatial | null = null;
  private readonly fakeCam;

  constructor(
    readonly lt: Lifetime,
    scene: SpaceScene,
    domElement: HTMLElement,
    readonly camera: THREE.Camera,
  ) {
    //axisVisualizer(lt, this.viewTarget);
    scene.addObject(lt, this.viewTarget);
    this.fakeCam = camera.clone();
    this.fakeCam.matrixAutoUpdate = true; // Needed to make things smooth for some reason
    this.cameraController = new OrbitControls(this.fakeCam, domElement);
    this.fakeCam.position.set(20, 20, 10);
    scene.cameraFocusBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
      this.targetSpatial = body ? body.spatial(valueLt) : null;
    });
  }

  private transformGimbal(newUpVec: THREE.Vector3, deltaRotation: THREE.Quaternion) {
    newUpVec.normalize();
    tmpVecA.setFromMatrixColumn(this.viewTarget.matrix, 2);
    tmpVecA.normalize();
    // tmpVecA is the current up vector of the gimbal
    tmpQuatA.setFromUnitVectors(tmpVecA, newUpVec);
    deltaRotation.premultiply(this.viewTarget.quaternion);
    this.viewTarget.quaternion.premultiply(tmpQuatA);
    tmpQuatA.copy(this.viewTarget.quaternion);
    tmpQuatA.invert();
    deltaRotation.multiply(tmpQuatA);
    this.fakeCam.position.applyQuaternion(deltaRotation);
  }

  private updateCameraFromOrbitControls() {
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

  update() {
    if (this.targetSpatial !== null) {
      this.targetSpatial.copyPositionInto(this.viewTarget.position);
      tmpVecA.setScalar(0);
      tmpVecB.setScalar(0);
      tmpVecC.setScalar(0);
      let parentSpatial = this.targetSpatial.parent();
      const camDist = this.fakeCam.position.length();
      while (parentSpatial) {
        parentSpatial.copyPositionInto(tmpVecA);
        if (tmpVecA.distanceTo(this.viewTarget.position) > camDist / 8) {
          break;
        }
        parentSpatial = parentSpatial.parent();
      }
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
      const quat = new THREE.Quaternion()
      const vec = new THREE.Vector3();
      vec.copy(tmpVecB);
      if (this.prevFocusSpatial !== parentSpatial) {
        this.prevFocusDir.copy(tmpVecA);
        this.prevFocusSpatial = parentSpatial;
      }
      quat.setFromUnitVectors(this.prevFocusDir, tmpVecA);
      this.prevFocusDir.copy(tmpVecA);
      this.transformGimbal(vec, quat);
    }
    this.updateCameraFromOrbitControls();
  }
}
