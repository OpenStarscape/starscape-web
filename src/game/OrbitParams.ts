import * as THREE from 'three';
import { TAU } from '../core';

const matTemp = new THREE.Matrix4();
const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();

/// Subscribes to the body's orbit and determines position from that
/// A lot of the math was figured out using https://space.stackexchange.com/a/8915
export class OrbitParams {
  protected baseTime = 0;
  protected periodTime = 0;
  protected semiMajor = 0; // Needed for velocity calculation
  protected eccentricity = 1;
  protected cachedTime: number | null = null; // The game time (if any) for which the cache is valid
  protected transform = new THREE.Matrix4();
  protected cachedEccentricAnomaly = 0;
  readonly cachedPosition = new THREE.Vector3();
  readonly cachedVelocity = new THREE.Vector3();

  setParams(
    semiMajor: number,
    semiMinor: number,
    inclination: number,
    ascendingNode: number,
    periapsis: number,
    baseTime: number,
    periodTime: number,
  ) {
    this.cachedTime = null;

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

  ensureCache(time: number) {
    // Do nothing if the cache is already up to date
    if (this.cachedTime === time) {
      return;
    }
    if (this.periodTime === 0) {
      // Everything would be NaN
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
    this.cachedEccentricAnomaly = eccentricAnomaly;
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

    this.copyParentVecsInto(tmpVecA, tmpVecB);
    this.cachedPosition.add(tmpVecA);
    this.cachedVelocity.add(tmpVecB);
  }

  protected copyParentVecsInto(_parentPos: THREE.Vector3, _parentVel: THREE.Vector3) {
  }
}
