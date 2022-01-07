import * as THREE from 'three';
import { SsObject } from '../protocol'

/// Subscribes to and processes the spatial aspects of a body
export interface Spatial {
  /// Returns the body's Starscape object
  bodyObj(): SsObject;
  /// Returns if values will be meaningful
  isReady(): boolean;
  /// Get the position, may leave input unchanged if position is not available
  copyPositionInto(vec: THREE.Vector3): void;
  /// Get the velocity, may leave input unchanged if position is not available
  copyVelocityInto(vec: THREE.Vector3): void;
  /// Returns the mass of the body
  mass(): number;
  /// Returns the "gravity parent" of the body (body this body is orbiting around)
  parent(): SsObject | null;
  /// Sets the transform for an orbit loop, asumes the orbit is a circle on the unit X/Y plane
  copyOrbitMatrixInto(mat: THREE.Matrix4): void;
}
