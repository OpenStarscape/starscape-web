import * as THREE from "three";
import { DependentLifetime } from "../core";
import { SsObject } from "../protocol";
import { OrbitBodySpatial } from './OrbitBodySpatial'
import { BodyVisual, CelestialVisual, ShipVisual } from './BodyVisual'
import type { BodyManager } from './BodyManager'

/// Just the spacial aspects of a body (not things like name or color)
export interface BodySpatial extends DependentLifetime {
  /// Returns if returned values will be meaningful
  isReady(): boolean;
  /// Get the position, may leave input unchanged if position is not available
  copyPositionInto(vec: THREE.Vector3): void;
  /// Get the velocity, may leave input unchanged if position is not available
  copyVelocityInto(vec: THREE.Vector3): void;
  /// Returns the mass of the body
  getMass(): number;
  /// Returns the "gravity parent" of the body (body this body is orbiting around)
  getParent(): Body | null;
  /// Sets the transform for an orbit loop, asumes the orbit is a circle on the unit X/Y plane
  copyOrbitMatrixInto(mat: THREE.Matrix4): void;
}

/// The parent class for all 3D body types.
export class Body extends DependentLifetime implements BodySpatial {
  /// The body manager subscribes and uses the setters for name and parent
  private name: string | null = null;
  private visual: BodyVisual | null = null;
  readonly spatial: BodySpatial;
  private bodyClass = '';

  constructor(
    manager: BodyManager,
    readonly obj: SsObject,
  ) {
    super();

    this.spatial = new OrbitBodySpatial(manager, obj);
    this.addDependent(this.spatial);

    obj.property('class', String).getThen(this, cls => {
      this.bodyClass = cls;
      if (cls === 'celestial') {
        this.visual = new CelestialVisual(manager.scene, this.obj, this.name, this.spatial);
      } else if (cls === 'ship') {
        this.visual = new ShipVisual(manager.scene, this.obj, this.name, this.spatial);
      } else {
        console.error('unknown body class ', cls);
      }
    });
  }

  isShip() {
    return this.bodyClass === 'ship';
  }

  isReady() {
    return this.spatial.isReady();
  }

  copyPositionInto(vec: THREE.Vector3): void {
    this.spatial.copyPositionInto(vec);
  }

  copyVelocityInto(vec: THREE.Vector3): void {
    this.spatial.copyVelocityInto(vec);
  }

  getMass(): number {
    return this.spatial.getMass();
  }

  getParent(): Body | null {
    return this.spatial.getParent();
  }

  copyOrbitMatrixInto(mat: THREE.Matrix4): void {
    this.spatial.copyOrbitMatrixInto(mat);
  }

  getName(): string | null {
    return this.name;
  }

  setName(name: string | null) {
    this.name = name;
    if (this.visual !== null) {
      this.visual.setName(name);
    }
  }

  update(cameraPosition: THREE.Vector3) {
    if (this.visual !== null) {
      this.visual.update(cameraPosition);
    }
  }
}
