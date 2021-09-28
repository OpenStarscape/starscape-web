import * as THREE from "three";
import { Lifetime, Vec3 } from "../core";
import { SsObject } from "../protocol";
import type { BodyManager } from './BodyManager'
import type { Body, BodySpatial } from './Body'

/// These all *should* be locals to copyOrbitMatrixInto() but js is fucking stupid and allocating
/// objects is expensive and I prematurely optimize so we make them global
const parentPos = new THREE.Vector3();
const parentVel = new THREE.Vector3();
const ourPos = new THREE.Vector3();
const relVel = new THREE.Vector3();
const scaleVec = new THREE.Vector3();
const orbitUp = new THREE.Vector3();
const orbitQuat = new THREE.Quaternion();
const zVec = new THREE.Vector3(0, 0, 1);

export class CartesianBodySpatial extends Lifetime implements BodySpatial {
  private position: Vec3 | undefined;
  private velocity: Vec3 | undefined;
  private mass: number | undefined;
  private parent: Body | null | undefined;

  constructor(
    readonly manager: BodyManager,
    readonly obj: SsObject,
  ) {
    super()
    obj.property('position', Vec3).subscribe(this, pos => {
      this.position = pos;
    });
    obj.property('velocity', Vec3).subscribe(this, vel => {
      this.velocity = vel;
    });
    obj.property('mass', Number).subscribe(this, mass => {
      this.mass = mass;
    });
    obj.property('grav_parent', {nullable: SsObject}).subscribe(this, parent => {
      this.parent = manager.get(parent) ?? null;
    });
  }

  isReady(): boolean {
    return (
      this.position !== undefined &&
      this.velocity !== undefined &&
      this.mass !== undefined &&
      this.parent !== undefined
    )
  }

  copyPositionInto(vec: THREE.Vector3): void {
    if (this.position !== undefined) {
      this.position.copyInto(vec);
    }
  }

  copyVelocityInto(vec: THREE.Vector3): void {
    if (this.velocity !== undefined) {
      this.velocity.copyInto(vec);
    }
  }

  getMass(): number {
    return this.mass ?? 0;
  }

  getParent(): Body | null {
    return this.parent ?? null;
  }

  // Primitive, only makes circular orbits
  copyOrbitMatrixInto(mat: THREE.Matrix4): void {
    if (this.position === undefined ||
        this.velocity === undefined ||
        !this.parent
    ) {
      return;
    }

    this.parent.copyPositionInto(parentPos);
    this.parent.copyVelocityInto(parentVel);
    this.position.copyInto(ourPos);
    this.velocity.copyInto(relVel);
    relVel.sub(parentVel);

    const distance = parentPos.distanceTo(ourPos);
    scaleVec.set(distance, distance, distance);
    orbitUp.copy(ourPos);
    orbitUp.sub(parentPos);
    orbitUp.cross(relVel);
    orbitUp.normalize();
    orbitQuat.setFromUnitVectors(zVec, orbitUp);

    mat.makeRotationFromQuaternion(orbitQuat);
    mat.setPosition(parentPos);
    mat.scale(scaleVec);
  }
}
