import * as THREE from "three";
import Lifetime from "../lib/Lifetime.js";
import Starfield from '../graphics/Starfield.js';
import BodyManager from '../graphics/BodyManager.js';
import CameraManager from '../graphics/CameraManager.js';

/// Manages everything required to render a 3D space view with three.js.
export default class SpaceScene {
  constructor(state, domParent) {
    this.god = state.connection.god;
    this.currentShip = state.currentShip;
    this.lt = new Lifetime();
    this.domParent = domParent;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor('black');
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.domParent.appendChild(this.renderer.domElement);

    this.starfield = new Starfield(this.lt, this.scene);
    this.bodies = new BodyManager(this.lt, this.scene, this.god);
    this.cameraManager = new CameraManager(
      this.lt,
      this.scene,
      this.renderer.domElement,
      this.bodies,
      state);
    this.cameraManager.setAspect(window.innerWidth / window.innerHeight);

    this.god.event('ship_created').subscribe(this.lt, obj => {
      state.currentShip.set(obj);
    });

    this.god.action('create_ship').fire([
      new THREE.Vector3(20000, 60000, 0),
      new THREE.Vector3(0, 0, 10000),
    ]);

    document.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.cameraManager.setAspect(window.innerWidth / window.innerHeight);
    });

    this.render();
  }

  render() {
    this.cameraManager.update();
    this.renderer.render(this.scene, this.cameraManager.camera);
    requestAnimationFrame(() => this.render());
  }
}
