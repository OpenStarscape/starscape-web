import * as THREE from "three";
import { Lifetime } from '../core';
import { Scene } from './Scene';

// lets go logarithmicDepthBuffer
const galaxyDiameter = 1e16;
const galaxyCount = 10000;
const localDiameter = 1e15;
const localCount = 10000;
const colorSaturation = 0.3;
const pointSize = 0.7;

const TAU = 2 * Math.PI;

/// Adds a stary background to a 3D scene.
export class Starfield {
  private galaxy: THREE.Points | null = null;
  private galaxyMat: THREE.PointsMaterial | null = null;
  private local: THREE.Points | null = null;
  private localMat: THREE.PointsMaterial | null = null;

  constructor(
    readonly lt: Lifetime,
    readonly scene: Scene
  ) {
    scene.subscribe(lt, () => {
      if (this.localMat && this.galaxyMat && this.local && this.galaxy) {
        const distance = scene.camera.position.length();
        const lowDistance = 10e6;
        const hightDistance = localDiameter;
        if (distance < lowDistance) {
          this.local.visible = true;
          this.galaxy.visible = false;
          this.localMat.size = pointSize;
        } else if (distance > hightDistance) {
          this.local.visible = false;
          this.galaxy.visible = true;
          this.galaxyMat.size = pointSize;
        } else {
          const rangeBottom = Math.log10(lowDistance);
          const rangeTop = Math.log10(hightDistance) - rangeBottom;
          const factor = Math.min(Math.max(Math.log10(distance) - rangeBottom, 0), rangeTop) / rangeTop;
          console.log(factor);
          this.local.visible = true;
          this.galaxy.visible = true;
          this.localMat.size = (1 - factor) * pointSize;
          this.galaxyMat.size = factor * pointSize;
        }
      }
    });
  }

  setVisible(visible: boolean) {
    if (visible && !this.galaxy) {
      this.initGalaxy();
      this.initLocal();
    }
    if (this.galaxy && this.local) {
      this.galaxy.visible = visible;
      this.local.visible = visible;
    }
  }

  private initGalaxy() {
    const positions = new Float32Array(galaxyCount * 3);
    const colors = new Float32Array(galaxyCount * 3);
    const position = new THREE.Vector3();
    for(let i = 0; i < galaxyCount; i++) {
      this.positionGalaxyStar(position);
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      colors[i * 3 + 0] = Math.min((1 - colorSaturation) + Math.random() * colorSaturation, 1);
      colors[i * 3 + 1] = Math.min((1 - colorSaturation) + Math.random() * colorSaturation, 1);
      colors[i * 3 + 2] = Math.min((1 - colorSaturation) + Math.random() * colorSaturation, 1);
    }
    const geom = this.lt.own(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.galaxyMat = this.lt.own(new THREE.PointsMaterial({
      sizeAttenuation: false,
      vertexColors: true,
      size: pointSize,
    }));
    this.galaxy = new THREE.Points(geom, this.galaxyMat);
    this.galaxy.matrixAutoUpdate = false;
    this.galaxy.scale.set(galaxyDiameter, galaxyDiameter, galaxyDiameter);
    this.galaxy.translateX(galaxyDiameter * 0.5);
    this.galaxy.rotateX(0.3);
    this.galaxy.rotateY(0.1);
    this.galaxy.updateMatrix();
    this.scene.addObject(this.lt, this.galaxy);
  }

  private initLocal() {
    const positions = new Float32Array(localCount * 3);
    const colors = new Float32Array(localCount * 3);
    const position = new THREE.Vector3();
    for(let i = 0; i < localCount; i++) {
      this.positionLocalStar(position);
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      colors[i * 3 + 0] = Math.min((1 - colorSaturation) + Math.random() * colorSaturation, 1);
      colors[i * 3 + 1] = Math.min((1 - colorSaturation) + Math.random() * colorSaturation, 1);
      colors[i * 3 + 2] = Math.min((1 - colorSaturation) + Math.random() * colorSaturation, 1);
    }
    const geom = this.lt.own(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.localMat = this.lt.own(new THREE.PointsMaterial({
      sizeAttenuation: false,
      vertexColors: true,
      size: pointSize,
    }));
    this.local = new THREE.Points(geom, this.localMat);
    this.local.matrixAutoUpdate = false;
    this.local.scale.set(localDiameter, localDiameter, localDiameter);
    this.local.updateMatrix();
    this.scene.addObject(this.lt, this.local);
  }

  private positionGalaxyStar(pos: THREE.Vector3) {
    const arm = Math.floor(Math.random() * 4);
    const distanceAlongArm = Math.random() ** 2;
    const angle = distanceAlongArm * 1.4 * TAU + arm * 0.25 * TAU;
    const armCenterX = Math.cos(angle) * distanceAlongArm;
    const armCenterY = Math.sin(angle) * distanceAlongArm;
    const jitter = (0.5 - 0.2 * distanceAlongArm) * Math.random();
    const height = (Math.random() - 0.5) * ((1 - distanceAlongArm) ** 3 + 0.6) * 0.6 * jitter;
    pos.set(
      armCenterX + (Math.random() - 0.5) * (jitter - Math.abs(height)),
      armCenterY + (Math.random() - 0.5) * (jitter - Math.abs(height)),
      height,
    );
  }

  private positionLocalStar(pos: THREE.Vector3) {
    pos.set(
      (Math.random() - 0.5),
      (Math.random() - 0.5),
      (Math.random() - 0.5));
    pos.normalize();
    pos.multiplyScalar(Math.random() + 0.1);
  }
}
