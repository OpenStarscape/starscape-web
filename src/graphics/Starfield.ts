import * as THREE from "three";
import { Lifetime, DependentLifetime, TAU } from '../core';
import { Scene } from './Scene';

// lets go logarithmicDepthBuffer
const galaxyDiameter = 1e17;
const fullGalaxyCount = 200000;
const sparseGalaxyCount = 5000;
const localDiameter = 5e15;
const localCount = 6000;
const localSize = localDiameter / 6000;
const localColorSaturation = 0.3;
const localColorBrightness = 0.8;
const galaxyColorSaturation = 0.4;
const galaxyColorBrightness = 1;
const galaxyPointSize = 1;
const minSparseOpacity = 0.2;
const galaxyDimDist = 10 ** (Math.log10(galaxyDiameter) * 0.8);
const galaxyBrightDist = galaxyDiameter * 2;

function lerpClamp(input: number, inLow: number, inHigh: number, outLow: number, outHigh: number): number {
  return Math.min(Math.max(((input - inLow) / (inHigh - inLow)) * (outHigh - outLow) + outLow, outLow), outHigh);
}

/// Adds a stary background to a 3D scene.
export class Starfield {
  // This will show a faint smudge when inside the galaxy
  private sparseGalaxy: THREE.Points | null = null;
  // This has more stars and is shows when zoomed out
  private fullGalaxy: THREE.Points | null = null;
  // This uses the same points as fullGalaxy and is shown at the same time. The difference is the
  // material has sizeAttenuation turned on, so the points are mostly too small to see but
  // get big if the camera is close
  private fullGalaxyAttenuation: THREE.Points | null = null;
  private local: THREE.Points | null = null;
  private visibleLt: DependentLifetime | null = null;
  private fullGalaxyLt: DependentLifetime | null = null;

  constructor(
    readonly scene: Scene
  ) {}

  setVisible(visible: boolean) {
    if (visible && !this.visibleLt) {
      this.visibleLt = this.scene.lt.newDependent();
      this.sparseGalaxy = this.initGalaxyMesh(
        this.visibleLt,
        this.initGalaxyGeom(this.visibleLt, sparseGalaxyCount),
        galaxyPointSize,
        false
      );
      (this.sparseGalaxy!.material as THREE.PointsMaterial).opacity = minSparseOpacity;
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
          const zeroToOne = Math.log10(dist / galaxyDimDist) * logScale;
          const sparseOpacity = lerpClamp(zeroToOne, 0, 0.8, minSparseOpacity, 1)
          const fullOpacity = lerpClamp(zeroToOne, 0.2, 1, 0, 1)
          if (zeroToOne > 0.0001) {
            if (!this.fullGalaxyLt) {
              this.fullGalaxyLt = this.visibleLt!.newDependent();
              const geom = this.initGalaxyGeom(this.fullGalaxyLt, fullGalaxyCount)
              this.fullGalaxy = this.initGalaxyMesh(this.fullGalaxyLt, geom, galaxyPointSize, false);
              this.fullGalaxyAttenuation = this.initGalaxyMesh(
                this.fullGalaxyLt, geom, galaxyDiameter / 10000, true);
              this.fullGalaxyLt.addCallback(() => {
                this.fullGalaxy = null;
                this.fullGalaxyAttenuation = null;
                this.fullGalaxyLt = null;
              });
            }
            (this.fullGalaxy!.material as THREE.PointsMaterial).opacity = fullOpacity;
            (this.fullGalaxyAttenuation!.material as THREE.PointsMaterial).opacity = fullOpacity;
          } else if (this.fullGalaxyLt) {
            this.fullGalaxyLt.kill();
          }
          (this.sparseGalaxy!.material as THREE.PointsMaterial).opacity = sparseOpacity;
          // hack because sizeAttenuation doesn't seem to work well on phones
          if (dist > localDiameter) {
            this.local!.visible = false;
          } else {
            this.local!.visible = true;
          }
        }
      });
    } else if (!visible && this.visibleLt) {
      this.visibleLt.kill();
    }
  }

  private initGalaxyGeom(lt: Lifetime, count: number): THREE.BufferGeometry {
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
    return geom;
  }

  private initGalaxyMesh(
    lt: Lifetime,
    geom: THREE.BufferGeometry,
    size: number,
    attenuation: boolean
  ): THREE.Points {
    const galaxyMat = lt.own(new THREE.PointsMaterial({
      sizeAttenuation: attenuation,
      vertexColors: true,
      size: size,
    }));
    galaxyMat.transparent = true;
    const galaxy = new THREE.Points(geom, galaxyMat);
    galaxy.scale.set(galaxyDiameter, galaxyDiameter, galaxyDiameter);
    galaxy.translateX(galaxyDiameter * 0.5);
    galaxy.translateZ(-galaxyDiameter * 0.19);
    galaxy.rotateX(0.1 * TAU);
    galaxy.rotateY(0.05 * TAU);
    galaxy.updateMatrix();
    galaxy.updateMatrixWorld();
    this.scene.addObject(lt, galaxy);
    return galaxy;
  }

  private positionGalaxyStar(pos: THREE.Vector3, color: Float32Array) {
    const arm = Math.floor(Math.random() * 4);
    const distanceAlongArm = Math.random() ** 3;
    const angle = distanceAlongArm * 1.4 * TAU + arm * 0.25 * TAU;
    const armCenterX = Math.cos(angle) * distanceAlongArm;
    const armCenterY = Math.sin(angle) * distanceAlongArm;
    const jitter = (0.5 - 0.2 * distanceAlongArm);
    const height = (Math.random() - 0.5) * ((1 - distanceAlongArm) ** 3 + 0.6) * 0.4 * jitter * Math.random();
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
    local.scale.set(localDiameter, localDiameter, localDiameter);
    local.updateMatrix();
    local.updateMatrixWorld();
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
