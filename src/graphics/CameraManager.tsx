import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Lifetime from '../lib/Lifetime';
import Game from '../lib/Game';
import {ValueElement} from '../lib/Element';
import BodyManager from './BodyManager';

/// Keeps track of creating and destroying bodies in the 3D scene.
export default class CameraManager {
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  readonly cameraController: OrbitControls;
  private readonly currentShip: ValueElement;

  constructor(
    readonly lt: Lifetime,
    readonly scene: THREE.Scene,
    domElement: HTMLCanvasElement,
    readonly bodies: BodyManager,
    game: Game,
  ) {
    this.scene = scene;
    this.scene.add(this.camera); // only required so children of the camera are visible
    this.cameraController = new OrbitControls(this.camera, domElement);
    this.cameraController.target.set(0, 0, -50);
    this.bodies = bodies;
    this.currentShip = game.currentShip;
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    let body = this.bodies.get(this.currentShip.get());
    let pos = new THREE.Vector3();
    if (body) {
      pos.copy(body.getPosition());
    }
    let delta = new THREE.Vector3();
    delta.subVectors(pos, this.cameraController.target);
    this.camera.position.add(delta);
    this.cameraController.target.copy(pos);
    this.cameraController.update();
  }
}
