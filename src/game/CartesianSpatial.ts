import * as THREE from "three";
import { Lifetime, Vec3 } from "../core";
import { SsObject } from "../protocol";
import type { Game } from './Game'
import type { Spatial } from './Spatial'
import type { Body } from './Body'

export class CartesianSpatial implements Spatial {
  private position: Vec3 | undefined;
  private velocity: Vec3 | undefined;
  private bodyMass: number | undefined;
  private parentSpatial: Spatial | null | undefined;
  private onReadyCallbacks: (() => void)[] = [];

  constructor(
    game: Game,
    lt: Lifetime,
    readonly body: Body,
  ) {
    body.obj.property('position', Vec3).subscribe(lt, pos => {
      this.position = pos;
      this.maybeReady();
    });
    body.obj.property('velocity', Vec3).subscribe(lt, vel => {
      this.velocity = vel;
      this.maybeReady();
    });
    body.obj.property('mass', Number).subscribe(lt, mass => {
      this.bodyMass = mass;
      this.maybeReady();
    });
    body.obj.property('grav_parent', {nullable: SsObject}).subscribe(lt, parent => {
      this.parentSpatial = parent ? game.getBody(parent).spatial(lt) : null;
      this.maybeReady();
    });
  }

  isReady(): boolean {
    return (
      this.position !== undefined &&
      this.velocity !== undefined &&
      this.bodyMass !== undefined &&
      this.parentSpatial !== undefined
    )
  }

  maybeReady(): void {
    if (this.onReadyCallbacks.length && this.isReady()) {
      for (let callback of this.onReadyCallbacks) {
        callback();
      }
      this.onReadyCallbacks = [];
    }
  }

  onReady(callback: () => void): void {
    if (this.isReady()) {
      callback();
    } else {
      this.onReadyCallbacks.push(callback);
    }
  }

  copyPositionInto(vec: THREE.Vector3): void {
    if (this.position !== undefined) {
      // TODO: interpolate based on velocity
      this.position.copyInto(vec);
    }
  }

  copyVelocityInto(vec: THREE.Vector3): void {
    if (this.velocity !== undefined) {
      this.velocity.copyInto(vec);
    }
  }

  mass(): number {
    return this.bodyMass ?? 0;
  }

  parent(): Body | null {
    return this.parentSpatial ? this.parentSpatial.body : null;
  }

  copyOrbitMatrixInto(_: THREE.Matrix4): boolean {
    return false;
  }
}
