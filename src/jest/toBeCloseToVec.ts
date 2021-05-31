import type { Vec3 } from '../core';
import type * as THREE from "three";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCloseToVec(value: Vec3 | THREE.Vector3): CustomMatcherResult;
    }
  }
}

function isCloseTo(a: number, b: number) {
  return Math.abs(a - b) < 0.0001
}

expect.extend({
  toBeCloseToVec: (a: Vec3 | THREE.Vector3, b: Vec3 | THREE.Vector3) => ({
    message: () => 'expected ' + a + ' to be close to ' + b,
    pass: isCloseTo(a.x, b.x) && isCloseTo(a.y, b.y) && isCloseTo(a.z, b.z),
  }),
});
