import * as THREE from 'three';
import { Lifetime, DependentLifetime } from '../core';
import { SsObject } from '../protocol';
import { CartesianSpatial } from './CartesianSpatial';
import type { Spatial } from './Spatial';
import type { Game } from './Game';

const TAU = 2 * Math.PI;
const matTemp = new THREE.Matrix4();
const vecTempA = new THREE.Vector3();
const vecTempB = new THREE.Vector3();

/// Subscribes to the body's orbit and determines position from that
/// A lot of the math was figured out using https://space.stackexchange.com/a/8915
export class OrbitSpatial implements Spatial {
  private cachedParent: SsObject | null = null;
  private parentSpatial: Spatial | null | undefined;
  private parentSpatialLt: DependentLifetime | null = null;
  private fallback: Spatial | null = null;
  private fallbackLt: DependentLifetime | null = null;
  private bodyMass: number | undefined;
  private baseTime = 0;
  private periodTime = 0;
  private semiMajor = 0; // Needed for velocity calculation
  private eccentricity = 1;
  private readonly transform = new THREE.Matrix4();
  private cachedTime: number | null = null; // The game time (if any) for which the cache is valid
  private readonly cachedPosition = new THREE.Vector3();
  private readonly cachedVelocity = new THREE.Vector3();

  constructor(
    private readonly game: Game,
    private readonly lt: Lifetime,
    private readonly obj: SsObject,
  ) {
    obj.property(
      'orbit',
      {nullable: [Number, Number, Number, Number, Number, Number, Number, SsObject]}
    ).subscribe(lt, params => {
      if (params === null) {
        this.useFallback();
      } else {
        this.setParams(...params);
      }
    });
    obj.property('mass', Number).subscribe(lt, mass => {
      this.bodyMass = mass;
    });
  }

  bodyObj(): SsObject {
    return this.obj;
  }

  private setParentSpatial(parent: SsObject | null) {
    if (this.cachedParent !== parent) {
      if (this.parentSpatialLt !== null) {
        this.parentSpatialLt.kill();
      }
      this.cachedParent = parent;
      if (parent !== null) {
        this.parentSpatialLt = this.lt.newDependent();
        this.parentSpatial = this.game.spatials.spatialFor(this.parentSpatialLt, parent);
      } else {
        this.parentSpatialLt = null;
        this.parentSpatial = null;
      }
    }
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
    // Orbital parameters only work if we're orbiting something. If there is no parent, use the fallback
    this.setParentSpatial(parent);
    if (this.parentSpatial === null) {
      this.useFallback();
      return;
    }
    if (this.fallbackLt !== null) {
      this.fallbackLt.kill();
    }

    this.baseTime = baseTime;
    this.periodTime = periodTime;

    // Distance from the center of the orbit to either focus
    const centerToFoci = Math.sqrt(semiMajor * semiMajor - semiMinor * semiMinor);
    this.semiMajor = semiMajor;
    this.eccentricity = centerToFoci / semiMajor;

    // Create the transformation matrix that will turn a point on a flat, unit circular orbit to a point on the real
    // orbit relative to the parent
    this.transform.makeScale(semiMajor, semiMinor, 1);
    this.transform.setPosition(-centerToFoci, 0, 0);
    matTemp.makeRotationZ(periapsis);
    this.transform.premultiply(matTemp);
    matTemp.makeRotationX(inclination);
    this.transform.premultiply(matTemp);
    matTemp.makeRotationZ(ascendingNode);
    this.transform.premultiply(matTemp);
  }

  private useFallback(): void {
    if (this.fallback === null) {
      this.fallbackLt = this.lt.newDependent();
      this.fallback = new CartesianSpatial(this.game, this.fallbackLt, this.obj);
      this.fallbackLt.addCallback(() => {
        this.fallback = null;
        this.fallbackLt = null;
      });
    }
  }

  isReady(): boolean {
    return (
      (!!this.parentSpatial && this.mass !== undefined) ||
      (this.fallback !== null && this.fallback.isReady())
    );
  }

  ensureCache() {
    // Do nothing if the cache is already up to date
    const time = this.game.animation.gameTime() ?? 0;
    if (this.cachedTime === time) {
      return;
    }
    this.cachedTime = time;
    const orbitsSinceStart = (time - this.baseTime) / this.periodTime;
    // mean anomaly is time within the orbit cycle represented as an angle, does not have geometric meaning
    // we use x - floor(x) instead of x % 1 because javascript % will produce negative results for negative numbers
    const meanAnomaly = (orbitsSinceStart - Math.floor(orbitsSinceStart)) * TAU;
    // eccentric anomaly is angle the body would be at if the space was stretched to make the orbit circular
    let eccentricAnomaly = meanAnomaly;
    // TODO: can we stick these in a lookup table?
    for (let i = 0; i < 5; i++) {
      eccentricAnomaly -= (
        (eccentricAnomaly - this.eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
        (1 - this.eccentricity * Math.cos(eccentricAnomaly))
      );
    }
    // eccentricAnomaly is the angle if the body's orbit was circular, so we use that to get an XY
    // position on the unit circle and then use the transform matrix to turn that into a position
    // in space
    this.cachedPosition.x = Math.cos(eccentricAnomaly);
    this.cachedPosition.y = Math.sin(eccentricAnomaly);
    this.cachedPosition.z = 0;
    if (isNaN(this.cachedPosition.x) || isNaN(this.cachedPosition.y)) {
      this.cachedPosition.x = 0;
      this.cachedPosition.y = 0;
    }

    // To calculate the velocity vector, we'll also need a point in the direction that we're moving
    this.cachedVelocity.copy(this.cachedPosition);
    this.cachedVelocity.x -= Math.sin(eccentricAnomaly);
    this.cachedVelocity.y += Math.cos(eccentricAnomaly);

    // Apply the matrix, which changes positions on the flat unit circle to positions on an elliptical orbit relative
    // to the parent
    this.cachedPosition.applyMatrix4(this.transform);
    this.cachedVelocity.applyMatrix4(this.transform);

    // Calculate the gravity parameter needed for the vis-viva equation in the next step.
    // It should generally always be the same, but no need to assume that when it's calculatable from the parameters.
    // https://en.wikipedia.org/wiki/Elliptic_orbit#Orbital_period
    const grav_param = (this.semiMajor ** 3) / ((this.periodTime / TAU) ** 2);

    // Distance between us and the parent
    const r = this.cachedPosition.length();

    // Our current speed
    // https://en.wikipedia.org/wiki/Elliptic_orbit#Velocity
    const speed = Math.sqrt(grav_param * ((2 / r) - (1 / this.semiMajor)));

    // Set our velocity
    this.cachedVelocity.sub(this.cachedPosition);
    this.cachedVelocity.setLength(speed);
    if (isNaN(this.cachedVelocity.x) || isNaN(this.cachedVelocity.y) || isNaN(this.cachedVelocity.z)) {
      this.cachedVelocity.set(0, 0, 0);
    }

    // Apply parent's position and velocity
    vecTempA.set(0, 0, 0);
    vecTempB.set(0, 0, 0);
    if (this.parentSpatial) {
      this.parentSpatial.copyPositionInto(vecTempA);
      this.parentSpatial.copyVelocityInto(vecTempB);
    }
    this.cachedPosition.add(vecTempA);
    this.cachedVelocity.add(vecTempB);
  }

  copyPositionInto(vec: THREE.Vector3): void {
    this.ensureCache();
    vec.copy(this.cachedPosition);
  }

  copyVelocityInto(vec: THREE.Vector3): void {
    this.ensureCache();
    vec.copy(this.cachedVelocity);
  }

  mass(): number {
    return this.bodyMass ?? 0;
  }

  parent(): SsObject | null {
    return this.parentSpatial ? this.parentSpatial.bodyObj() : null;
  }

  copyOrbitMatrixInto(mat: THREE.Matrix4): void {
    mat.copy(this.transform);
    // Apply parent's position
    if (this.parentSpatial) {
      this.parentSpatial.copyPositionInto(vecTempA);
      matTemp.makeTranslation(vecTempA.x, vecTempA.y, vecTempA.z);
      mat.premultiply(matTemp);
    }
  }
}
