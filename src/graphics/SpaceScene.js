import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import Lifetime from "../lib/Lifetime.js";
import Starfield from '../graphics/Starfield.js';
import { makeBody } from "../graphics/Body.js";

/// Manages everything required to render a 3D space view with three.js.
export default class SpaceScene {
  constructor(connection) {
    this.lt = new Lifetime();
    this.connection = connection;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor('black');
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraController = new TrackballControls(this.camera, this.renderer.domElement);

    this.starfield = new Starfield(this.lt, this.scene);

    this.connection.god.property('bodies').getThen(this.lt, bodies => {
      bodies.forEach(obj => {
        makeBody(this.lt, obj, body => {
          this.scene.add(body.mesh);
        });
      });
      this.connection.god.action('create_ship').fire([
        new THREE.Vector3(20000, 60000, 0),
        new THREE.Vector3(0, 0, 10000),
      ]);
    });
    this.connection.god.event('ship_created').subscribe(this.lt, obj => {
      makeBody(this.lt, obj, body => {
        this.scene.add(body.mesh);
        if (!this.currentShip && body.isShip()) {
          body.mesh.attach(this.camera);
          this.currentShip = body;
          this.camera.position.set(0.0, 0.0, 20.0);
          this.camera.rotation.set(0.0, 0.0, 0.0);
        }
      });
    });

    document.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.render();
  }

  domElement() {
    return this.renderer.domElement;
  }

  render() {
    this.cameraController.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}
