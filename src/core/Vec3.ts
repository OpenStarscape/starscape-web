import * as THREE from 'three';

/// The type for incoming 3D vectors. An immutable version of THREE.Vector3. only one object is created no matter how
/// many things are subscribed, so it's important nothing changes it. Methods with the same name as THREE.Vector3
/// methods do the same thing. When converting to/from a THREE.Vector3, a scale is required. Vec3s should have the scale
/// of the Starscape protocol, and THREE.Vector3 should have the scale of the 3D scene.
export class Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor();
  constructor(x: number, y: number, z: number);
  /// When constructing from a THREE.Vector3, inverse_scale should be the same value as is sent as the scale when
  /// copying into a THREE.Vector3. It's "inverse" because in this case it's being used the divide the input.
  constructor(threeVec: THREE.Vector3, inverse_scale: number);
  constructor(first?: number | THREE.Vector3, second?: number, third?: number) {
    if (first === undefined) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    } else if (typeof first === 'number') {
      this.x = first;
      this.y = second!;
      this.z = third!;
    } else {
      const scale = 1 / second!;
      this.x = first.x * scale;
      this.y = first.y * scale;
      this.z = first.z * scale;
    }
  }

  /// Can be given any type, can only return true for other SsVector3s and THREE.Vector3s
  equals(other: any) {
    if (!(other instanceof Vec3) && !(other instanceof THREE.Vector3)) {
      return false;
    }
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  newThreeVector3(scale: number): THREE.Vector3 {
    return new THREE.Vector3(this.x * scale, this.y * scale, this.z * scale);
  }

  copyInto(vec: THREE.Vector3, scale: number) {
    vec.set(this.x * scale, this.y * scale, this.z * scale);
  }

  toArray(): number[] {
    return [this.x, this.y, this.z]
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
}
