import * as THREE from "three";

const emptyGeom = new THREE.BufferGeometry();
const upVec = new THREE.Vector3(0, 1, 0);

/// The parent class for all 3D body types.
class Body {
  constructor(group, obj) {
    this.group = group;
    this.obj = obj;
    this.mat = new THREE.MeshBasicMaterial({color: 'white'});
    this.mesh = new THREE.Mesh(emptyGeom, this.mat);
    this.obj.property('position').subscribe(this.group, pos => {
      this.mesh.position.copy(pos);
      this.mesh.position.multiplyScalar(0.001);
    });
  }

  isShip() {
    return false;
  }
}

class Celestial extends Body {
  constructor(group, obj) {
    super(group, obj)
    this.obj.property('mass').getThen(this.group, mass => {
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
  constructor(group, obj) {
    super(group, obj)
    this.mat.color.setHex(0xFFFFFF);
    this.mesh.geometry = new THREE.ConeGeometry(0.5, 2, 16);
    this.velocity = new THREE.Vector3();
    //this.previousVel = new THREE.Vector3();
    //this.thrustDir = new THREE.Vector3();
    this.obj.property('velocity').subscribe(this.group, vel => {
      //this.thrustDir.subVectors(vel, this.previousVel);
      //this.thrustDir.normalize();
      //this.previousVel = vel;
      this.velocity.copy(vel);
      this.velocity.normalize();
      this.mesh.quaternion.setFromUnitVectors(upVec, this.velocity);
    });
  }

  isShip() {
    return true;
  }
}

export function makeBody(group, obj, callback) {
  obj.property('class').getThen(group, cls => {
    if (cls == 'celestial') {
      callback(new Celestial(group, obj));
    } else if (cls == 'ship') {
      callback(new Ship(group, obj));
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
