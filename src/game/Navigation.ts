import { Body } from './Body';
import { SsObject } from '../protocol';
import { Vec3 } from '../core';

export enum Scheme {
  None,
  Orbit,
  Dock,
  FlyBy,
}

export interface NoneState {
  scheme: Scheme.None,
}

export interface OrbitState {
  scheme: Scheme.Orbit,
  target: Body,
  distance: number | null,
}

export interface DockState {
  scheme: Scheme.Dock,
  target: Body,
}

export interface FlyByState {
  scheme: Scheme.FlyBy,
  target: Body,
}

export type State = NoneState | OrbitState | DockState | FlyByState;

export function applyState(ship: Body, state: State) {
  const obj = ship.obj;
  if (state.scheme === Scheme.None) {
    obj.property('ap_scheme', String).set('off');
    obj.property('accel', Vec3).set(new Vec3());
  }
  else if (state.scheme === Scheme.Orbit) {
    obj.property('ap_scheme', String).set('orbit');
    obj.property('ap_target', SsObject).set(state.target.obj);
    obj.property('ap_distance', {nullable: Number}).set(state.distance);
  } else if (state.scheme === Scheme.Dock) {
    obj.property('ap_scheme', String).set('dock');
    obj.property('ap_target', SsObject).set(state.target.obj);
  } else if (state.scheme === Scheme.FlyBy) {
    obj.property('ap_scheme', String).set('flyby');
    obj.property('ap_target', SsObject).set(state.target.obj);
  }
  else {
    console.error('Invalid autopilot state');
  }
}

export function targetOf(state: State): Body | null {
  return state.scheme === Scheme.None ? null : state.target
}
