import * as THREE from "three";
import { Lifetime } from '../core';

/// Adds a stary background to a 3D scene.
export class Starfield {
  // lets go logarithmicDepthBuffer
  private closest = 1e12;
  private farthest = 1e16;
  private geom;
  private materials: THREE.PointsMaterial[] = [];
  private stars: THREE.Points[] = [];

  constructor(
    readonly lt: Lifetime,
    readonly scene: THREE.Scene
  ) {
    this.geom = lt.own(new THREE.BufferGeometry());
    this.geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0.0, 0.0, 0.0]), 3));
    for (let i = 0.5; i < 1.5; i *= 1.1) {
      this.materials.push(lt.own(new THREE.PointsMaterial({
        color: 0xffffff,
        sizeAttenuation: false,
        size: i
      })));
    }

    for(let i = 0; i < 1000; i++) {
      this.newStar();
    }
  }

  newStar() {
    const mat = this.materials[Math.floor(Math.random() * this.materials.length)];
    const star = new THREE.Points(this.geom, mat);
    star.position.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5);
    star.position.normalize()
    const distance = Math.random() * (this.farthest - this.closest) + this.closest;
    star.position.multiplyScalar(distance);
    star.matrixAutoUpdate = false;
    star.updateMatrix();
    this.stars.push(star);
    this.scene.add(star);
  }

  /// removing from scene can be easily implemented if needed
}
