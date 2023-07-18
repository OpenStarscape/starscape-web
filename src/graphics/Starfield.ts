import * as THREE from "three";
import { Lifetime, DependentLifetime } from '../core';
import { Scene } from './Scene';

// lets go logarithmicDepthBuffer
const galaxyDiameter = 1e16;
const fullGalaxyCount = 100000;
const sparseGalaxyCount = 5000;
const localDiameter = 1e15;
const localCount = 4000;
const localSize = localDiameter / 5000;
const localColorSaturation = 0.3;
const localColorBrightness = 0.8;
const galaxyColorSaturation = 0.4;
const galaxyColorBrightness = 0.8;
const minGalaxyPointSize = 0.5;
const maxGalaxyPointSize = 0.8;
const galaxyDimDist = 10 ** (Math.log10(galaxyDiameter) / 2);
const galaxyBrightDist = galaxyDiameter;

const TAU = 2 * Math.PI;

/// Adds a stary background to a 3D scene.
export class Starfield {
  private sparseGalaxy: THREE.Points | null = null;
  private fullGalaxy: THREE.Points | null = null;
  private local: THREE.Points | null = null;
  private visibleLt: DependentLifetime | null = null;
  private fullGalaxyLt: DependentLifetime | null = null;

  constructor(
    readonly scene: Scene
  ) {}

  setVisible(visible: boolean) {
    if (visible && !this.visibleLt) {
      this.visibleLt = this.scene.lt.newDependent();
      this.sparseGalaxy = this.initGalaxy(this.visibleLt, sparseGalaxyCount);
      this.local = this.initLocal(this.visibleLt, localCount);
      this.visibleLt.addCallback(() => {
        this.visibleLt = null;
        this.sparseGalaxy = null;
        this.local = null;
      });
      const logScale = 1 / Math.log10(galaxyBrightDist / galaxyDimDist);
      const minLengthSq = galaxyDimDist * galaxyDimDist;
      this.scene.subscribe(this.visibleLt, () => {
        if (this.fullGalaxy || this.scene.camera.position.lengthSq() > minLengthSq) {
          const dist = this.scene.camera.position.length();
          const zeroToOne = Math.min(Math.max(Math.log10(dist / galaxyDimDist) * logScale, 0), 1);
          if (zeroToOne > 0) {
            if (!this.fullGalaxyLt) {
              this.fullGalaxyLt = this.visibleLt!.newDependent();
              this.fullGalaxy = this.initGalaxy(this.fullGalaxyLt, fullGalaxyCount);
              this.fullGalaxyLt.addCallback(() => {
                this.fullGalaxy = null;
                this.fullGalaxyLt = null;
              });
              console.log('full galaxy created');
            }
          } else {
            if (this.fullGalaxyLt) {
              this.fullGalaxyLt.kill();
              console.log('full galaxy destroyed');
            }
          }
          const sparsePointSize = zeroToOne * (maxGalaxyPointSize - minGalaxyPointSize) + minGalaxyPointSize;
          const fullPointSize = zeroToOne * maxGalaxyPointSize;
          console.log('sparsePointSize:', sparsePointSize, 'fullPointSize:', fullPointSize);
          (this.sparseGalaxy!.material as THREE.PointsMaterial).size = sparsePointSize;
          if (this.fullGalaxy) {
            (this.fullGalaxy.material as THREE.PointsMaterial).size = fullPointSize;
          }
        }
      });
    } else if (!visible && this.visibleLt) {
      this.visibleLt.kill();
    }
  }

  private initGalaxy(lt: Lifetime, count: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const position = new THREE.Vector3();
    const color = new Float32Array(3);
    for(let i = 0; i < count; i++) {
      this.positionGalaxyStar(position, color);
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      colors[i * 3 + 0] = galaxyColorBrightness - galaxyColorSaturation + Math.max(Math.min(color[0], 1), 0) * galaxyColorSaturation;
      colors[i * 3 + 1] = galaxyColorBrightness - galaxyColorSaturation + Math.max(Math.min(color[1], 1), 0) * galaxyColorSaturation;
      colors[i * 3 + 2] = galaxyColorBrightness - galaxyColorSaturation + Math.max(Math.min(color[2], 1), 0) * galaxyColorSaturation;
    }
    const geom = lt.own(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const galaxyMat = lt.own(new THREE.PointsMaterial({
      sizeAttenuation: false,
      vertexColors: true,
      size: minGalaxyPointSize,
    }));
    const galaxy = new THREE.Points(geom, galaxyMat);
    galaxy.matrixAutoUpdate = false;
    galaxy.scale.set(galaxyDiameter, galaxyDiameter, galaxyDiameter);
    galaxy.translateX(galaxyDiameter * 0.5);
    galaxy.translateZ(-galaxyDiameter * 0.15);
    galaxy.rotateX(0.1 * TAU);
    galaxy.rotateY(0.05 * TAU);
    galaxy.updateMatrix();
    this.scene.addObject(lt, galaxy);
    return galaxy;
  }

  private positionGalaxyStar(pos: THREE.Vector3, color: Float32Array) {
    const arm = Math.floor(Math.random() * 4);
    const distanceAlongArm = Math.random() ** 2;
    const angle = distanceAlongArm * 1.4 * TAU + arm * 0.25 * TAU;
    const armCenterX = Math.cos(angle) * distanceAlongArm;
    const armCenterY = Math.sin(angle) * distanceAlongArm;
    const jitter = (0.5 - 0.2 * distanceAlongArm);
    const height = (Math.random() - 0.5) * ((1 - distanceAlongArm) ** 3 + 0.6) * 0.6 * jitter * Math.random();
    pos.set(
      armCenterX + (Math.random() - 0.5) * (jitter * Math.random() - Math.abs(height)),
      armCenterY + (Math.random() - 0.5) * (jitter * Math.random() - Math.abs(height)),
      height,
    );
    color[0] = 1 - distanceAlongArm * 0.7 + (Math.random() - 0.5) * 0.5;
    color[1] = (1 - distanceAlongArm) ** 2 + (Math.random() - 0.5) * 0.5;
    color[2] = distanceAlongArm + Math.max(1 - distanceAlongArm * 4, 0) ** 2 + (Math.random() - 0.5) * 0.5;
  }

  private initLocal(lt: Lifetime, count: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const position = new THREE.Vector3();
    for(let i = 0; i < count; i++) {
      this.positionLocalStar(position);
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      colors[i * 3 + 0] = localColorBrightness * Math.min((1 - localColorSaturation) + Math.random() * localColorSaturation, 1);
      colors[i * 3 + 1] = localColorBrightness * Math.min((1 - localColorSaturation) + Math.random() * localColorSaturation, 1);
      colors[i * 3 + 2] = localColorBrightness * Math.min((1 - localColorSaturation) + Math.random() * localColorSaturation, 1);
    }
    const geom = lt.own(new THREE.BufferGeometry());
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const localMat = lt.own(new THREE.PointsMaterial({
      sizeAttenuation: true,
      vertexColors: true,
      size: localSize,
    }));
    const local = new THREE.Points(geom, localMat);
    local.matrixAutoUpdate = false;
    local.scale.set(localDiameter, localDiameter, localDiameter);
    local.updateMatrix();
    this.scene.addObject(lt, local);
    return local;
  }

  private positionLocalStar(pos: THREE.Vector3) {
    pos.set(
      (Math.random() - 0.5),
      (Math.random() - 0.5),
      (Math.random() - 0.5));
    pos.normalize();
    pos.multiplyScalar((Math.random() + 0.05));
  }
}
