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

/// Subscribes to the body's orbit and determines position from that
/// A lot of the math was figured out using https://space.stackexchange.com/a/8915
export class OrbitSpatial extends OrbitParams implements Spatial {
  private cachedParent: SsObject | null = null;
  private parentSpatial: Spatial | null | undefined;
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
        this.setParentSpatial(params[7]);
        // Orbital parameters only work if we're orbiting something. If there is no parent, use the
        // fallback
        if (this.parentSpatial === null) {
          this.useFallback();
        } else {
          this.setParams(
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            params[6],
          );
          this.paramsValid = true;
          if (this.fallbackLt !== null) {
            this.fallbackLt.kill();
          }
          this.maybeReady();
        }
      }
    });
    body.obj.property('mass', Number).subscribe(lt, mass => {
      this.bodyMass = mass;
      this.maybeReady();
    });
  }

  private setParentSpatial(parent: SsObject | null) {
    if (this.cachedParent !== parent) {
      if (this.parentSpatialLt !== null) {
        this.parentSpatialLt.kill();
      }
      this.cachedParent = parent;
      if (parent !== null) {
        this.parentSpatialLt = this.lt.newDependent();
        this.parentSpatial = this.game.getBody(parent).spatial(this.parentSpatialLt);
      } else {
        this.parentSpatialLt = null;
        this.parentSpatial = null;
      }
    }
  }

  private useFallback(): void {
    if (this.fallbackLt === null) {
      this.fallbackLt = this.lt.newDependent();
      const spatial = new CartesianSpatial(this.game, this.fallbackLt, this.body);
      this.fallbackLt.addCallback(() => {
        this.fallback = null;
        this.fallbackLt = null;
      });
      spatial.onReady(() => {
        this.fallback = spatial;
        this.paramsValid = false;
        this.maybeReady();
      });
    }
  }

  isReady(): boolean {
    return (
      (this.paramsValid && !!this.parentSpatial && this.mass !== undefined) ||
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

  parent(): Body | null {
    if (this.parentSpatial !== undefined) {
      return this.parentSpatial ? this.parentSpatial.body : null;
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
