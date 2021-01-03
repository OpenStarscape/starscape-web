import * as THREE from "three";

const emptyGeom = new THREE.BufferGeometry();
const upVec = new THREE.Vector3(0, 1, 0);

/// The parent class for all 3D body types.
class Body {
  constructor(lifetime, scene, obj) {
    this.lt = lifetime;
    this.scene = scene;
    this.obj = obj;
    this.mat = new THREE.MeshBasicMaterial({color: 'white'});
    this.mesh = new THREE.Mesh(emptyGeom, this.mat);
    this.obj.property('position').subscribe(this.lt, pos => {
      this.mesh.position.copy(pos);
      this.mesh.position.multiplyScalar(1);
    });
  }

  isShip() {
    return false;
  }

  position() {
    return this.mesh.position;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

class Celestial extends Body {
  constructor(lifetime, scene, obj) {
    super(lifetime, scene, obj)
    this.obj.property('size').getThen(this.lt, km => {
      const size = km * 100;
      if (size > 3) {
        // Star
        this.mat.color.setHex(0xFFE060);
      } else {
        // Planet/moon
        this.mat.color.setHex(0x6090FF);
      }
      this.mesh.geometry = new THREE.SphereBufferGeometry(size, 16, 16);
      this.scene.add(this.mesh);
    });
  }
}

class Ship extends Body {
  constructor(lifetime, scene, obj) {
    super(lifetime, scene, obj)
    this.mat.color.setHex(0xFFFFFF);
    this.mesh.geometry = new THREE.ConeGeometry(0.2, 0.5, 16);
    this.velocity = new THREE.Vector3();
    //this.previousVel = new THREE.Vector3();
    //this.thrustDir = new THREE.Vector3();
    this.obj.property('velocity').subscribe(this.lt, vel => {
      //this.thrustDir.subVectors(vel, this.previousVel);
      //this.thrustDir.normalize();
      //this.previousVel = vel;
      this.velocity.copy(vel);
      this.velocity.normalize();
      this.mesh.quaternion.setFromUnitVectors(upVec, this.velocity);
    });
    this.scene.add(this.mesh);
  }

  isShip() {
    return true;
  }
}

export function makeBody(lifetime, scene, obj, callback) {
  obj.property('class').getThen(lifetime, cls => {
    if (!lifetime.isAlive()) {
      return;
    } else if (cls == 'celestial') {
      callback(new Celestial(lifetime, scene, obj));
    } else if (cls == 'ship') {
      callback(new Ship(lifetime, scene, obj));
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
