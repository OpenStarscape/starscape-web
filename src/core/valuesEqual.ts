import * as THREE from 'three';

/// If two types and values are equal, using different methods depending on type. This is intended primarily for
/// detecting if property updates need to be propagated, so the rules are a little different than normal js:
/// - NaN equals NaN
/// - Vectors are compared by contained value
/// - Arrays are compared by value recursively
/// - Other objects are compared by reference
export function valuesEqual(a: any, b: any) {
  if (a instanceof THREE.Vector3 && b instanceof THREE.Vector3) {
    return a.equals(b);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!valuesEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  } else {
    /// Starscape objects can be handled like everything else
    return a === b;
  }
}
