import * as THREE from "three";

const emptyGeom = new THREE.BufferGeometry();
const upVec = new THREE.Vector3(0, 1, 0);

class Body {
  constructor(state, obj) {
    this.state = state;
    this.obj = obj;
    this.mat = new THREE.MeshBasicMaterial({color: 'white'});
    this.mesh = new THREE.Mesh(emptyGeom, this.mat);
    this.state.subscribeProperty(this.obj.property('position'), pos => {
      pos = pos.multiplyScalar(0.001);
      this.mesh.position = pos;
    });
  }

  isShip() {
    return false;
  }
}

class Celestial extends Body {
  constructor(state, obj) {
    super(state, obj)
    this.state.getProperty(this.obj.property('mass'), mass => {
      const size = Math.pow(mass / 1.0e+13, 1 / 3.0) + 0.1;
      if (size > 3) {
        // Star
        this.mat.color.setHex(0xFFE060);
      } else {
        // Planet/moon
        this.mat.color.setHex(0x6090FF);
      }
      this.mesh.geometry = new THREE.SphereBufferGeometry(size, 16, 16);
    });
  }
}

class Ship extends Body {
  constructor(state, obj) {
    super(state, obj)
    this.mat.color.setHex(0xFFFFFF);
    this.mesh.geometry = new THREE.ConeGeometry(0.5, 2, 16);
    this.previousVel = new THREE.Vector3();
    //this.thrustDir = new THREE.Vector3();
    this.state.subscribeProperty(this.obj.property('velocity'), vel => {
      //this.thrustDir.subVectors(vel, this.previousVel);
      //this.thrustDir.normalize();
      //this.previousVel = vel;
      vel.normalize();
      this.mesh.quaternion.setFromUnitVectors(upVec, vel);
    });
  }

  isShip() {
    return true;
  }
}

export function makeBody(state, obj, callback) {
  state.getProperty(obj.property('class'), cls => {
    if (cls == 'celestial') {
      callback(new Celestial(state, obj));
    } else if (cls == 'ship') {
      callback(new Ship(state, obj));
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
