import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lifetime } from '../core';
import { Spatial } from '../game';
import { SpaceScene } from './SpaceScene';

/// Keeps track of creating and destroying bodies in the 3D scene.
export class CameraManager {
  readonly cameraController: OrbitControls;
  readonly bodyPos = new THREE.Vector3();
  private readonly posDelta = new THREE.Vector3();
  private currentSpatial: Spatial | null = null;

  constructor(
    readonly lt: Lifetime,
    scene: SpaceScene,
    domElement: HTMLElement,
    private readonly camera: THREE.Camera,
  ) {
    this.cameraController = new OrbitControls(this.camera, domElement);
    this.cameraController.target.set(-20, -20, -10);
    scene.cameraFocusBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
      this.currentSpatial = body ? body.spatial(valueLt) : null;
    });
    // Manually updating the matrices isn't smooth, idk why
    camera.matrixAutoUpdate = true;
    camera.matrixWorldAutoUpdate = true;
    scene.subscribe(lt, () => {
      if (this.currentSpatial !== null) {
        this.currentSpatial.copyPositionInto(this.bodyPos);
      }
      this.posDelta.subVectors(this.bodyPos, this.cameraController.target);
      this.camera.position.add(this.posDelta);
      this.cameraController.target.copy(this.bodyPos);
      this.cameraController.update();
    });
  }
}
