import * as THREE from "three";
import { Lifetime } from '../core';
import { Scene } from './Scene';

// lets go logarithmicDepthBuffer
const galaxyDiameter = 1e16;
const galaxyCount = 100000;
const localDiameter = 1e15;
const localCount = 4000;
const galaxyColorSaturation = 0.5;
const localColorSaturation = 0.3;
const minGalaxyPointSize = 0.3;
const maxGalaxyPointSize = 0.9;
const galaxyDimDist = 10 ** (Math.log10(galaxyDiameter) / 2);
const galaxyBrightDist = galaxyDiameter;

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
    const divisor = Math.log10(galaxyBrightDist / galaxyDimDist);
    const minLengthSq = galaxyDimDist * galaxyDimDist;
    let pointSizeSet = false;
    scene.subscribe(lt, () => {
      if (this.galaxyMat && (pointSizeSet || scene.camera.position.lengthSq() > minLengthSq)) {
        const dist = scene.camera.position.length();
        const zeroToOne = Math.log10(dist / galaxyDimDist) / divisor;
        if (zeroToOne < 0) {
          pointSizeSet = false;
        } else {
          pointSizeSet = true;
        }
        const pointSizeUnclamped = zeroToOne * (maxGalaxyPointSize - minGalaxyPointSize) + minGalaxyPointSize;
        this.galaxyMat.size = Math.min(Math.max(pointSizeUnclamped, minGalaxyPointSize), maxGalaxyPointSize);
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
    const color = new Float32Array(3);
    for(let i = 0; i < galaxyCount; i++) {
      this.positionGalaxyStar(position, color);
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      colors[i * 3 + 0] = Math.min(1 - galaxyColorSaturation + color[0] * galaxyColorSaturation, 1);
      colors[i * 3 + 1] = Math.min(1 - galaxyColorSaturation + color[1] * galaxyColorSaturation, 1);
      colors[i * 3 + 2] = Math.min(1 - galaxyColorSaturation + color[2] * galaxyColorSaturation, 1);
    }
    const geom = this.lt.own(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.galaxyMat = this.lt.own(new THREE.PointsMaterial({
      sizeAttenuation: false,
      vertexColors: true,
      size: minGalaxyPointSize,
    }));
    this.galaxy = new THREE.Points(geom, this.galaxyMat);
    this.galaxy.matrixAutoUpdate = false;
    this.galaxy.scale.set(galaxyDiameter, galaxyDiameter, galaxyDiameter);
    this.galaxy.translateX(galaxyDiameter * 0.5);
    this.galaxy.translateZ(-galaxyDiameter * 0.2);
    this.galaxy.rotateX(0.1 * TAU);
    this.galaxy.rotateY(0.05 * TAU);
    this.galaxy.updateMatrix();
    this.scene.addObject(this.lt, this.galaxy);
  }

  private positionGalaxyStar(pos: THREE.Vector3, color: Float32Array) {
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
    color[0] = 1 - distanceAlongArm * 0.7;
    color[1] = (1 - distanceAlongArm) ** 2;
    color[2] = distanceAlongArm + Math.max(1 - distanceAlongArm * 4, 0) ** 2;
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
      colors[i * 3 + 0] = Math.min((1 - localColorSaturation) + Math.random() * localColorSaturation, 1);
      colors[i * 3 + 1] = Math.min((1 - localColorSaturation) + Math.random() * localColorSaturation, 1);
      colors[i * 3 + 2] = Math.min((1 - localColorSaturation) + Math.random() * localColorSaturation, 1);
    }
    const geom = this.lt.own(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.localMat = this.lt.own(new THREE.PointsMaterial({
      sizeAttenuation: true,
      vertexColors: true,
      size: localDiameter / 4000,
    }));
    this.local = new THREE.Points(geom, this.localMat);
    this.local.matrixAutoUpdate = false;
    this.local.scale.set(localDiameter, localDiameter, localDiameter);
    this.local.updateMatrix();
    this.scene.addObject(this.lt, this.local);
  }

  private positionLocalStar(pos: THREE.Vector3) {
    pos.set(
      (Math.random() - 0.5),
      (Math.random() - 0.5),
      (Math.random() - 0.5));
    pos.normalize();
    pos.multiplyScalar((Math.random() + 0.1));
  }
}
