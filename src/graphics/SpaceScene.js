import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import Lifetime from "../lib/Lifetime.js";
import Starfield from '../graphics/Starfield.js';
import { makeBody } from "../graphics/Body.js";

export default class SpaceScene {
  constructor(connection) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({antialias: true});

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    camera.position.z = 100;

    renderer.setClearColor("#000000");
    renderer.setSize(window.innerWidth, window.innerHeight);

    this.addControllers();
    this.starfield = new Starfield(this.scene);

    this.connection = connection;
    this.lt = new Lifetime();
    this.connection.god.property('bodies').getThen(this.lt, bodies => {
      bodies.forEach(obj => {
        makeBody(this.lt, obj, body => {
          this.scene.add(body.mesh);
          //if (!this.currentShip && body.isShip()) {
            //body.mesh.attach(this.camera);
            //this.currentShip = body;
            //this.camera.position.set(0.0, 0.0, 20.0);
            //this.camera.rotation.set(0.0, 0.0, 0.0);
          //}
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
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    this.render();
  }

  domElement() {
    return this.renderer.domElement;
  }

  createShip() {
    const ship = new THREE.ConeGeometry(2, 10, 50, 10);
    const material = new THREE.MeshStandardMaterial({color: 0xff00ff, side: THREE.DoubleSide});
    const mesh = new THREE.Mesh(ship, material);

    this.ship = mesh;
    this.scene.add(mesh);
  }

  addControllers() {
    console.log("ADDED CONTROLLER");
    this.cameraController = new TrackballControls(this.camera, this.renderer.domElement);
  }

  move(obj, direction) {
    obj.position.x += direction.x;
    obj.position.y += direction.y;
    obj.position.z += direction.z;
  }

  render() {
    this.cameraController.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}
