import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Lifetime from "../lib/Lifetime.js";
import Starfield from '../graphics/Starfield.js';
import BodyManager from '../graphics/BodyManager.js';
import OrbitList from '../graphics/OrbitList.js';
import ShipNameField from '../graphics/ShipNameField.js';
import CameraManager from '../graphics/CameraManager.js';

/// Manages everything required to render a 3D space view with three.js.
export default class SpaceScene {
  constructor(state, domParent) {
    this.god = state.connection.god;
    this.currentShip = state.currentShip;
    this.lt = new Lifetime();
    this.domParent = domParent;
    this.scene = new THREE.Scene();

    const uiDiv = document.createElement('div');
    uiDiv.style.cssText = 'position:absolute;z-index:400';
    this.domParent.appendChild(uiDiv);

    const buttonDiv = document.createElement('div');
    buttonDiv.style.display = 'inline-block';
    uiDiv.appendChild(buttonDiv);

    const elem = document.createElement('div');
    elem.style.cssText = 'display:block;width:200px;height:200px;border-radius:100px;opacity:0.3;background:#8000ff';
    elem.style.color = 'white';
    elem.textContent = 'Manual Control Area';
    buttonDiv.appendChild(elem);
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
        this.thrustLt.dispose();
        this.thrustLt = null;
      }
      if (obj) {
        console.log('Switching to ship ', obj.id);
        this.thrustLt = this.lt.newChild();
        obj.property('accel').subscribe(this.thrustLt, accel => {
          const vec = accel.clone();
          vec.normalize();
          this.thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
          let len = accel.length();
          this.thrustMesh.scale.set(len, len, len);
        });
      }
    });
    this.manualControls = true;

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor('black');
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.domParent.appendChild(this.renderer.domElement);

    this.overlayRenderer = new CSS2DRenderer();
    this.overlayRenderer.setSize(window.innerWidth, window.innerHeight);
    this.overlayRenderer.domElement.style.position = 'absolute';
    this.overlayRenderer.domElement.style.top = '0px';
    this.domParent.appendChild(this.overlayRenderer.domElement);

    this.starfield = new Starfield(this.lt, this.scene);
    this.bodies = new BodyManager(this.lt, this.scene, this.god);
    this.cameraManager = new CameraManager(
      this.lt,
      this.scene,
      this.overlayRenderer.domElement,
      this.bodies,
      state);
    this.cameraManager.setAspect(window.innerWidth / window.innerHeight);

    const shipCreatedLt = this.lt.newChild();
    this.god.event('ship_created').subscribe(shipCreatedLt, obj => {
      state.currentShip.set(obj);
      shipCreatedLt.dispose(); // only handle this callback once
    });

    this.god.action('create_ship').fire([
      new THREE.Vector3(150, 10, 0),
      new THREE.Vector3(0, 0, -30),
    ]);

    const shipNameDiv = document.createElement('div');
    shipNameDiv.style.display = 'inline-block';
    shipNameDiv.style.verticalAlign = 'top';
    uiDiv.appendChild(shipNameDiv);
    this.shipNameField = new ShipNameField(shipNameDiv, this.currentShip);

    this.orbitList = new OrbitList(this.lt, this.god, buttonDiv, targetObj => {
      const body = this.bodies.get(this.currentShip.get());
      if (targetObj == body) {
        targetObj = null;
      }
      if (body && targetObj === null) {
        body.obj.property('ap_scheme').set('off');
        body.obj.property('accel').set(new THREE.Vector3(0, 0, 0));
        this.manualControls = true;
      } else if (body && targetObj) {
        body.obj.property('ap_scheme').set('orbit');
        body.obj.property('ap_target').set(targetObj);
        body.obj.property('ap_distance').set(null);
        this.manualControls = false;
      } else {
        console.error('Could not set up autopilot');
      }
    });

    document.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.overlayRenderer.setSize(window.innerWidth, window.innerHeight);
      this.cameraManager.setAspect(window.innerWidth / window.innerHeight);
    });

    this.render();
  }

  render() {
    this.thrustControls.update();
    const vec = new THREE.Vector3();
    vec.subVectors(this.thrustObj.position, this.thrustControls.target);
    vec.normalize();
    vec.multiplyScalar(1);
    if (!vec.equals(this.cachedThrust) && this.manualControls) {
      this.cachedThrust.copy(vec);
      if (this.currentShip.get()) {
        this.currentShip.get().property('accel').set(vec);
      }
    }

    this.cameraManager.update();
    this.bodies.update(this.cameraManager.camera.position);

    let body = this.bodies.get(this.currentShip.get());
    if (body) {
      this.thrustMesh.position.copy(body.getPosition());
    }

    this.renderer.render(this.scene, this.cameraManager.camera);
    this.overlayRenderer.render(this.scene, this.cameraManager.camera);
    requestAnimationFrame(() => this.render());
  }
}
