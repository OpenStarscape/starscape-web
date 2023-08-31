import * as THREE from 'three';
import { Lifetime, DependentLifetime } from '../core';
import { SsObject } from '../protocol';
import { OrbitParams } from './OrbitParams';
import { CartesianSpatial } from './CartesianSpatial';
import type { Spatial } from './Spatial';
import type { Game } from './Game';
import type { Body } from './Body';

const tmpMatA = new THREE.Matrix4();
const tmpVecA = new THREE.Vector3();

type OrbitDataT = [number, number, number, number, number, number, number, SsObject];

/// Subscribes to the body's orbit and determines position from that
/// A lot of the math was figured out using https://space.stackexchange.com/a/8915
export class OrbitSpatial extends OrbitParams implements Spatial {
  private pendingParent: SsObject | null = null;
  private pendingParentSpatialLt: DependentLifetime | null = null;
  private pendingParams: OrbitDataT | null = null;
  private activeParent: SsObject | null = null;
  private parentSpatial: Spatial | null = null;
  private parentSpatialLt: DependentLifetime | null = null;
  private fallback: Spatial | null = null;
  private fallbackLt: DependentLifetime | null = null;
  private bodyMass: number | undefined;
  private paramsValid = false;
  private onReadyCallbacks: (() => void)[] = [];

  constructor(
    private readonly game: Game,
    private readonly lt: Lifetime,
    readonly body: Body,
  ) {
    super();
    body.obj.property(
      'orbit',
      {nullable: [Number, Number, Number, Number, Number, Number, Number, SsObject]}
    ).subscribe(lt, params => {
      if (params === null) {
        this.useFallback();
      } else {
        if (this.fallbackLt) {
          this.fallbackLt.kill();
        }
        const parent = params[7];
        if (this.activeParent === parent) {
          this.setParams(
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            params[6],
          );
        } else {
          const paramsCopy = params.slice() as typeof params;
          if (this.pendingParent === parent) {
            this.pendingParams = paramsCopy;
          } else {
            this.setPendingParent(parent, paramsCopy);
          }
        }
      }
    });
    body.obj.property('mass', Number).subscribe(lt, mass => {
      this.bodyMass = mass;
      this.maybeReady();
    });
  }

  private setPendingParent(parent: SsObject, params: OrbitDataT): void {
    if (this.pendingParentSpatialLt) {
      this.pendingParentSpatialLt.kill();
    }
    this.pendingParent = parent;
    const parentSpatialLt = this.lt.newDependent();
    this.pendingParentSpatialLt = parentSpatialLt
    const parentSpatial = this.game.getBody(parent).spatial(parentSpatialLt);
    this.pendingParams = params;
    parentSpatialLt.addCallback(() => {
      if (this.pendingParentSpatialLt === parentSpatialLt) {
        this.pendingParent = null;
        this.pendingParentSpatialLt = null;
        this.pendingParams = null;
      }
      if (this.parentSpatialLt === parentSpatialLt) {
        this.activeParent = null;
        this.parentSpatialLt = null;
        this.parentSpatial = null;
      }
    });
    parentSpatial.onReady(() => {
      if (this.pendingParentSpatialLt !== parentSpatialLt) {
        parentSpatialLt.kill();
        return;
      }
      if (this.parentSpatialLt !== null) {
        this.parentSpatialLt.kill();
      }
      this.pendingParent = null;
      this.pendingParentSpatialLt = null;
      this.activeParent = parent;
      this.parentSpatialLt = parentSpatialLt;
      this.parentSpatial = parentSpatial;
      this.setParams(
        this.pendingParams![0],
        this.pendingParams![1],
        this.pendingParams![2],
        this.pendingParams![3],
        this.pendingParams![4],
        this.pendingParams![5],
        this.pendingParams![6],
      );
      this.pendingParams = null;
      this.paramsValid = true;
      this.maybeReady();
    });
  }

  private useFallback(): void {
    if (this.fallbackLt === null) {
      const fallbackLt = this.lt.newDependent();
      this.fallbackLt = fallbackLt;
      const spatial = new CartesianSpatial(this.game, fallbackLt, this.body);
      this.fallbackLt.addCallback(() => {
        this.fallback = null;
        this.fallbackLt = null;
      });
      if (this.pendingParentSpatialLt) {
        this.pendingParentSpatialLt.kill();
      }
      spatial.onReady(() => {
        if (this.fallbackLt === fallbackLt) {
          this.fallback = spatial;
          this.paramsValid = false;
          if (this.parentSpatialLt) {
            this.parentSpatialLt.kill();
          }
          this.maybeReady();
        }
      });
    }
  }

  isReady(): boolean {
    return (
      (this.paramsValid && this.mass !== undefined) ||
      (this.fallback !== null && this.fallback.isReady())
    );
  }

  private maybeReady(): void {
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

  protected copyParentVecsInto(parentPos: THREE.Vector3, parentVel: THREE.Vector3) {
    if (this.parentSpatial) {
      this.parentSpatial.copyPositionInto(parentPos);
      this.parentSpatial.copyVelocityInto(parentVel);
    }
  }

  copyPositionInto(vec: THREE.Vector3): void {
    if (this.paramsValid) {
      this.ensureCache(this.game.animation.gameTime());
      vec.copy(this.cachedPosition);
    } else if (this.fallback !== null) {
      this.fallback.copyPositionInto(vec);
    }
  }

  copyVelocityInto(vec: THREE.Vector3): void {
    if (this.paramsValid) {
      this.ensureCache(this.game.animation.gameTime());
      vec.copy(this.cachedVelocity);
    } else if (this.fallback !== null) {
      this.fallback.copyVelocityInto(vec);
    }
  }

  mass(): number {
    if (this.bodyMass !== undefined) {
      return this.bodyMass;
    } else if (this.fallback !== null) {
      return this.fallback.mass();
    } else {
      return 0;
    }
  }

  parent(): Spatial | null {
    if (this.parentSpatial !== undefined) {
      return this.parentSpatial;
    } else if (this.fallback !== null) {
      return this.fallback.parent();
    } else {
      return null;
    }
  }

  copyOrbitMatrixInto(mat: THREE.Matrix4): boolean {
    if (this.paramsValid) {
      if (this.eccentricity > 0.95) {
        return false;
      } else {
        this.ensureCache(this.game.animation.gameTime());
        mat.makeRotationZ(this.cachedEccentricAnomaly);
        mat.premultiply(this.transform);
        // Apply parent's position
        if (this.parentSpatial) {
          this.parentSpatial.copyPositionInto(tmpVecA);
          tmpMatA.makeTranslation(tmpVecA);
          mat.premultiply(tmpMatA);
        }
        return true;
      }
    } else if (this.fallback !== null) {
      return this.fallback.copyOrbitMatrixInto(mat);
    } else {
      return false;
    }
  }
}
