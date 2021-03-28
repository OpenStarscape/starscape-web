import * as THREE from "three";
import { Lifetime, Vec3 } from "../core";
import { SsObject } from "../protocol";
import type { BodyManager } from './BodyManager'
import type { Body } from './Body'

export class CartesianBodySpatial extends Lifetime {
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
}
