import * as THREE from 'three';
import { Lifetime, Vec3 } from '../core';
import { CartesianBodySpatial } from './CartesianBodySpatial';
import { SsObject } from '../protocol';
import type { BodyManager } from './BodyManager'
import type { Body, BodySpatial } from './Body'

const TAU = 2 * Math.PI;
const matTemp = new THREE.Matrix4();

/// Subscribes to the body's orbit and determines position from that
/// A lot of the math was figured out using https://space.stackexchange.com/a/8915
export class OrbitBodySpatial extends Lifetime implements BodySpatial {
  private parent: Body | null | undefined;
  private fallback: (BodySpatial & Lifetime) | null = null;
  private mass: number | undefined;
  private baseTime = 0;
  private periodTime = 0;
  private readonly transform = new THREE.Matrix4();
  private eccentricity = 1;

  constructor(
    readonly manager: BodyManager,
    readonly obj: SsObject,
  ) {
    super()
    obj.property(
      'orbit',
      {nullable: [Number, Number, Number, Number, Number, Number, Number, SsObject]}
    ).subscribe(this, params => {
      if (params === null) {
        this.useFallback();
      } else {
        this.setParams(...params);
      }
    });
    obj.property('mass', Number).subscribe(this, mass => {
      this.mass = mass;
    });
  }

  private setParams(
    semiMajor: number,
    semiMinor: number,
    inclination: number,
    ascendingNode: number,
    periapsis: number,
    baseTime: number,
    periodTime: number,
    parent: SsObject | null
  ) {
    this.parent = this.manager.get(parent) ?? null;
    if (this.parent === null) {
      this.useFallback();
      return;
    }
    if (this.fallback !== null) {
      this.fallback.dispose();
      this.fallback = null;
    }

    this.baseTime = baseTime;
    this.periodTime = periodTime;

    semiMajor *= Vec3.threeScale;
    semiMinor *= Vec3.threeScale;

    const centerToFoci = Math.sqrt(semiMajor * semiMajor - semiMinor * semiMinor);
    this.eccentricity = centerToFoci / semiMajor;

    this.transform.makeScale(semiMajor, semiMinor, 1);
    this.transform.setPosition(-centerToFoci, 0, 0);
    matTemp.makeRotationZ(periapsis);
    this.transform.premultiply(matTemp);
    matTemp.makeRotationX(inclination);
    this.transform.premultiply(matTemp);
    matTemp.makeRotationZ(ascendingNode);
    this.transform.premultiply(matTemp);
  }

  useFallback(): void {
    if (this.fallback === null) {
      this.fallback = new CartesianBodySpatial(this.manager, this.obj);
      this.addChild(this.fallback);
    }
  }

  isReady(): boolean {
    return (
      (!!this.parent && this.mass !== undefined) ||
      (this.fallback !== null && this.fallback.isReady())
    );
  }

  copyPositionInto(vec: THREE.Vector3): void {
    const time = this.manager.game.frameTime();
    const orbitsSinceStart = (time - this.baseTime) / this.periodTime;
    const meanAnomaly = (orbitsSinceStart % 1) * TAU;
    let eccentricAnomaly = meanAnomaly;
    // TODO: is this magic number optimal?
    // TODO: can we stick these in a lookup table?
    for (let i = 0; i < 12; i++) {
      const delta = (
        (eccentricAnomaly - this.eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
        (1 - this.eccentricity * Math.cos(eccentricAnomaly))
      );
      eccentricAnomaly = eccentricAnomaly - delta;
    }
    // eccentricAnomaly is the angle if the body's orbit was circular, so we use that to get an XY
    // position on the unit circle and then use the transform matrix to turn that into a position
    // in space
    vec.x = Math.cos(eccentricAnomaly);
    vec.y = Math.sin(eccentricAnomaly);
    vec.z = 0;
    if (isNaN(vec.x) || isNaN(vec.y)) {
      vec.x = 0;
      vec.y = 0;
    }
    vec.applyMatrix4(this.transform);
  }

  copyVelocityInto(vec: THREE.Vector3): void {
    // TODO
    vec.set(0, 0, 0);
  }

  getMass(): number {
    return this.mass ?? 0;
  }

  getParent(): Body | null {
    return this.parent ?? null;
  }

  copyOrbitMatrixInto(mat: THREE.Matrix4): void {
    mat.copy(this.transform);
  }
}
