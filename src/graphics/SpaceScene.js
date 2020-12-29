import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import CallbackGroup from "../lib/CallbackGroup.js";
import { makeBody } from "../graphics/Body.js";

function randRange(start, end) {
  start = Math.floor(start);
  end = Math.ceil(end);

  return Math.floor(Math.random() * (end - start + 1)) + start;
}

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
    this.addStars();

    this.connection = connection;
    this.group = new CallbackGroup();
    this.connection.god.property('bodies').getThen(this.group, bodies => {
      bodies.forEach(obj => {
        makeBody(this.group, obj, body => {
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
    this.connection.god.event('ship_created').subscribe(this.group, obj => {
      makeBody(this.group, obj, body => {
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

  addStars() {
    console.log("ADDED STARS");
    const RAND_RANGE_START = -1000;
    const RAND_RANGE_END = 1000;

    for(let i = 0; i < 500; i++) {
      const dotGeometry = new THREE.Geometry();
      const dotMaterial = new THREE.PointsMaterial();
      const dot = new THREE.Points(dotGeometry, dotMaterial);

      dotGeometry.vertices.push(new THREE.Vector3());

      let position = new THREE.Vector3(
        randRange(RAND_RANGE_START, RAND_RANGE_END),
        randRange(RAND_RANGE_START, RAND_RANGE_END),
        randRange(RAND_RANGE_START, RAND_RANGE_END));
      position.normalize()
      position.multiplyScalar(randRange(300, 1000));
      dot.position.x = position.x;
      dot.position.y = position.y;
      dot.position.z = position.z;

      this.scene.add(dot);
    }
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
