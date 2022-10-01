import * as THREE from 'three';
import type { Body } from './Body';

/// Subscribes to and processes the spatial aspects of a body
export interface Spatial {
  readonly body: Body;
  /// Returns if values will be meaningful
  isReady(): boolean;
  /// Calls the callback once when isReady becomes true, or immediately if it's already true
  onReady(callback: () => void): void;
  /// Get the position, may leave input unchanged if position is not available
  copyPositionInto(vec: THREE.Vector3): void;
  /// Get the velocity, may leave input unchanged if position is not available
  copyVelocityInto(vec: THREE.Vector3): void;
  /// Returns the mass of the body
  mass(): number;
  /// Returns the "gravity parent" of the body (body this body is orbiting around)
  parent(): Body | null;
  /// Sets the transform for an orbit loop, asumes the orbit is a circle on the unit X/Y plane
  copyOrbitMatrixInto(mat: THREE.Matrix4): void;
}
