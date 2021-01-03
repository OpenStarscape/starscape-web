import * as THREE from "three";
import Lifetime from "../lib/Lifetime.js";
import Starfield from '../graphics/Starfield.js';
import BodyManager from '../graphics/BodyManager.js';
import CameraManager from '../graphics/CameraManager.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

/// Manages everything required to render a 3D space view with three.js.
export default class SpaceScene {
  constructor(state, domParent) {
    this.god = state.connection.god;
    this.currentShip = state.currentShip;
    this.lt = new Lifetime();
    this.domParent = domParent;
    this.scene = new THREE.Scene();

    const elem = document.createElement('div');
    elem.style.cssText = 'position:absolute;width:200px;height:200px;border-radius:100px;opacity:0.3;z-index:400;background:#8000ff';
    this.domParent.appendChild(elem);
    this.thrustObj = new THREE.Object3D();
    this.thrustObj.position.set(10, 0, 0);
    this.scene.add(this.thrustObj);
    this.thrustControls = new TrackballControls(this.thrustObj, elem);
    this.thrustControls.staticMoving = true;
    const mat = new THREE.MeshBasicMaterial({color: 0x20ff40, wireframe: true});
    const geom = new THREE.ConeGeometry(0.5, 3, 3);
    geom.translate(0, 4, 0);
    this.thrustMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.thrustMesh);
    this.cachedThrust = new THREE.Vector3();
    this.thrustLt = null
    this.currentShip.subscribe(this.lt, obj => {
      if (this.thrustLt) {
        this.lt.disposeOf(this.thrustLt);
      }
      if (obj) {
        console.log('Switching to ship ', obj.id);
        this.thrustLt = new Lifetime();
        this.lt.add(this.thrustLt);
        obj.property('thrust').subscribe(this.thrustLt, thrust => {
          const vec = thrust.clone();
          vec.normalize();
          this.thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
        });
      } else {
        this.thrustLt = null;
      }
    });

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
      new THREE.Vector3(1.496e+2, 10.0, 0.0),
      new THREE.Vector3(0, 0, 30),
    ]);

    document.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.cameraManager.setAspect(window.innerWidth / window.innerHeight);
    });

    this.render();
  }

  render() {
    this.thrustControls.update();
    const vec = new THREE.Vector3();
    vec.subVectors(this.thrustObj.position, this.thrustControls.target);
    vec.normalize();
    vec.multiplyScalar(1000);
    if (!vec.equals(this.cachedThrust)) {
      this.cachedThrust.copy(vec);
      if (this.currentShip.get()) {
        //this.currentShip.get().property('thrust').set(vec);
      }
    }

    this.cameraManager.update();
    this.bodies.update();

    let body = this.bodies.get(this.currentShip.get());
    if (body) {
      this.thrustMesh.position.copy(body.position());
    }

    this.renderer.render(this.scene, this.cameraManager.camera);
    requestAnimationFrame(() => this.render());
  }
}
