import * as THREE from "three";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Lifetime from "../lib/Lifetime.js";

const emptyGeom = new THREE.BufferGeometry();
const circleGeom = new THREE.CircleGeometry(1, 120);
circleGeom.vertices.shift(); // Remove center vertex
const yVec = new THREE.Vector3(0, 1, 0);
const zVec = new THREE.Vector3(0, 0, 1);
const sceneScale = 1;

/// The parent class for all 3D body types.
class Body {
  constructor(lifetime, scene, obj) {
    this.lt = lifetime;
    this.scene = scene;
    this.obj = obj;
    this.name = null; // Instead of us subscribing, the manager subscribes and uses the setter
    this.getMass = this.obj.property('mass').getter(this.lt);
    this.getVelocity = this.obj.property('velocity').getter(this.lt);

    this.solidMat = new THREE.MeshBasicMaterial({color: 'white'});
    this.wireMat = new THREE.MeshBasicMaterial({color: 'white', wireframe: true});
    this.lineMat = new THREE.LineBasicMaterial({color: 'white'}),
    this.lt.add(this.solidMat);
    this.lt.add(this.wireMat);
    this.lt.add(this.lineMat);
    this.mesh = new THREE.Mesh(emptyGeom, this.wireMat);
    this.size = 1;
    this.getRawPos = this.obj.property('position').getter(this.lt);
    this.scene.add(this.mesh);

    // This is probs a better way: https://stackoverflow.com/a/21742175
    this.orbitLine = new THREE.LineLoop(circleGeom, this.lineMat);
    this.scene.add(this.orbitLine);
    this.orbitUp = new THREE.Vector3();

    this.setGravBody(null);
    this.obj.property('grav_parent').subscribe(this.lt, grav_parent => {
      this.setGravBody(grav_parent);
    });

    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'body-label';
    this.labelDiv.style.marginTop = '1em';
    this.label = new CSS2DObject(this.labelDiv);
    this.label.visible = false;
    this.mesh.add(this.label);
  }

  isShip() {
    return false;
  }

  setGravBody(gravBody) {
    // this.gravBodyLt is only used directly by this function. It gets recreated every time the
    // gravity body changes.
    if (this.gravBodyLt) {
      this.lt.disposeOf(this.gravBodyLt);
    }
    if (gravBody !== null) {
      this.gravBodyLt = new Lifetime();
      this.lt.add(this.gravBodyLt)
      this.getGravBodyPos = gravBody.property('position').getter(this.gravBodyLt);
      this.getGravBodyMass = gravBody.property('mass').getter(this.gravBodyLt);
    } else {
      this.gravBodyLt = null;
      this.getGravBodyPos = () => undefined;
      this.getGravBodyMass = () => undefined;
    }
  }

  setToPosition(vec) {
    const raw = this.getRawPos();
    if (raw) {
      vec.copy(this.getRawPos());
      vec.multiplyScalar(sceneScale);
    }
  }

  getPosition() {
    const result = new THREE.Vector3();
    this.setToPosition(result);
    return result;
  }

  setColor(color) {
    if (!color) {
      color = '0xFFFFFF';
    }
    this.wireMat.color.setHex(color);
    this.solidMat.color.setHex(color);
    this.lineMat.color.setHex(color);
    this.labelDiv.style.color = '#' + color.slice(2);
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
    if (name !== null) {
      this.labelDiv.textContent = name;
      this.label.visible = true;
    } else {
      this.label.visible = false;
    }
  }

  update(cameraPosition) {
    this.setToPosition(this.mesh.position);
    const dist = this.mesh.position.distanceTo(cameraPosition);
    const scale = dist / 100 / this.size;
    if (scale > 1) {
      this.mesh.scale.setScalar(scale);
      this.mesh.material = this.solidMat;
    } else {
      this.mesh.scale.setScalar(1);
      this.mesh.material = this.wireMat;
    }

    if (this.getGravBodyPos() !== undefined &&
        this.getGravBodyMass() !== undefined &&
        this.getGravBodyMass() > this.getMass()) {
      this.orbitLine.visible = true;
      this.orbitLine.position.copy(this.getGravBodyPos());
      this.orbitLine.position.multiplyScalar(sceneScale);
      const distance = this.orbitLine.position.distanceTo(this.mesh.position);
      this.orbitLine.scale.setScalar(distance);
      this.orbitUp.copy(this.getGravBodyPos());
      this.orbitUp.sub(this.mesh.position);
      this.orbitUp.cross(this.getVelocity());
      this.orbitUp.normalize();
      this.orbitLine.quaternion.setFromUnitVectors(zVec, this.orbitUp);
    } else {
      this.orbitLine.visible = false;
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

class Celestial extends Body {
  constructor(lifetime, scene, obj) {
    super(lifetime, scene, obj)
    this.obj.property('color').subscribe(this.lt, color => this.setColor(color));
    this.obj.property('size').getThen(this.lt, km => {
      this.size = km * sceneScale;
      this.mesh.geometry = new THREE.SphereBufferGeometry(this.size, 16, 16);
      this.lt.add(this.mesh.geometry);
    });
  }
}

class Ship extends Body {
  constructor(lifetime, scene, obj) {
    super(lifetime, scene, obj);
    this.setColor('0xFFFFFF');
    this.size = 0.01;
    this.mesh.geometry = new THREE.ConeBufferGeometry(0.01, 0.03, 16);
    this.lt.add(this.mesh.geometry);
    this.direction = new THREE.Vector3();
    this.getAccel = this.obj.property('accel').getter(this.lt);
  }

  isShip() {
    return true;
  }

  update(cameraPosition) {
    super.update(cameraPosition);
    if (this.getAccel() !== undefined) {
      this.direction.copy(this.getAccel());
    }
    if (this.direction.lengthSq() < 0.0005 && this.getVelocity() !== undefined) {
      this.direction.copy(this.getVelocity());
    }
    this.direction.normalize();
    this.mesh.quaternion.setFromUnitVectors(yVec, this.direction);
  }
}

export function makeBody(lifetime, scene, obj, callback) {
  obj.property('class').getThen(lifetime, cls => {
    if (cls == 'celestial') {
      callback(new Celestial(lifetime, scene, obj));
    } else if (cls == 'ship') {
      callback(new Ship(lifetime, scene, obj));
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
