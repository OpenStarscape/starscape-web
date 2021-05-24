import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Lifetime, LocalProperty } from '../core';
import { Game } from '../game';
import { SsObject } from '../protocol';
import { BodyManager } from './BodyManager';

/// Keeps track of creating and destroying bodies in the 3D scene.
export default class CameraManager {
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  readonly cameraController: OrbitControls;
  private readonly currentShip: LocalProperty<SsObject | null>;
  private readonly bodyPos = new THREE.Vector3();
  private readonly posDelta = new THREE.Vector3();

  constructor(
    readonly lt: Lifetime,
    readonly scene: THREE.Scene,
    domElement: HTMLElement,
    readonly bodies: BodyManager,
    game: Game,
  ) {
    this.scene = scene;
    this.scene.add(this.camera); // only required so children of the camera are visible
    this.cameraController = new OrbitControls(this.camera, domElement);
    this.cameraController.target.set(-20, -20, -10);
    this.bodies = bodies;
    this.currentShip = game.currentShip;
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    let body = this.bodies.get(this.currentShip.get());
    if (body !== undefined) {
      body.copyPositionInto(this.bodyPos);
    }
    this.posDelta.subVectors(this.bodyPos, this.cameraController.target);
    this.camera.position.add(this.posDelta);
    this.cameraController.target.copy(this.bodyPos);
    this.cameraController.update();
  }
}
