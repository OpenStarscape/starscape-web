import * as THREE from "three";

/// Adds a stary background to a 3D scene.
export default class Starfield {
  constructor(lifetime, scene) {
    this.closest = 600;
    this.farthest = 800;
    this.lt = lifetime;
    this.scene = scene;
    this.geom = new THREE.Geometry();
    this.lt.add(this.geom);
    this.geom.vertices.push(new THREE.Vector3());
    this.smallMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
    this.bigMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.0 });
    this.lt.add(this.mat);
    this.stars = [];
    this.isAdded = false;

    for(let i = 0; i < 100; i++) {
      this.newStar(this.bigMat);
    }
    for(let i = 0; i < 300; i++) {
      this.newStar(this.smallMat);
    }

    for (let i = 0; i < this.stars.length; i++) {
      this.scene.add(this.stars[i]);
    }
  }

  newStar(mat) {
    const star = new THREE.Points(this.geom, mat);
    star.position.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5);
    star.position.normalize()
    const distance = Math.random() * (this.farthest - this.closest) + this.closest;
    star.position.multiplyScalar(distance);
    this.stars.push(star);
  }

  /// removing from scene can be easily implemented if needed
}
