import { CartesianSpatial } from '../CartesianSpatial';
import { DependentLifetime, LocalProperty, Vec3 } from '../../core'
import * as THREE from "three";

const lt = new DependentLifetime();

function mockGame() {
  return {
    spatials: {
      spatialFor: (_lt: any, _obj: any) => {
        return {
          copyPositionInto: (_vec: THREE.Vector3) => {},
          copyVelocityInto: (_vec: THREE.Vector3) => {},
        };
      },
    },
  } as any;
}

function mockObj() {
  const obj = {
    property: (name: string, _rtType: any) => {
      return obj[name];
    },
    position: new LocalProperty(new Vec3()),
    velocity: new LocalProperty(new Vec3()),
    mass: new LocalProperty(1),
    grav_parent: new LocalProperty(7),
  } as any;
  return obj;
}

test('CartesianSpatial subscribes to position', () => {
  const obj = mockObj();
  const spatial = new CartesianSpatial(mockGame(), lt, obj);
  obj.position.set(new Vec3(1, 2, 3));
  const result = new THREE.Vector3();
  spatial.copyPositionInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3(1, 2, 3));
});

test('CartesianSpatial has no issue with undefined position', () => {
  const obj = mockObj();
  const spatial = new CartesianSpatial(mockGame(), lt, obj);
  obj.position.set(undefined);
  const result = new THREE.Vector3();
  spatial.copyVelocityInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3());
});

test('CartesianSpatial subscribes to velocity', () => {
  const obj = mockObj();
  const spatial = new CartesianSpatial(mockGame(), lt, obj);
  obj.velocity.set(new Vec3(1, 2, 3));
  const result = new THREE.Vector3();
  spatial.copyVelocityInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3(1, 2, 3));
});

test('CartesianSpatial has no issue with undefined velocity', () => {
  const obj = mockObj();
  const spatial = new CartesianSpatial(mockGame(), lt, obj);
  obj.velocity.set(undefined);
  const result = new THREE.Vector3();
  spatial.copyVelocityInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3());
});

test('CartesianSpatial subscribes to mass', () => {
  const obj = mockObj();
  const spatial = new CartesianSpatial(mockGame(), lt, obj);
  obj.mass.set(12);
  expect(spatial.mass()).toBe(12);
});

test('CartesianSpatial has no issue with undefined mass', () => {
  const obj = mockObj();
  const spatial = new CartesianSpatial(mockGame(), lt, obj);
  obj.mass.set(undefined);
  expect(spatial.mass()).toBe(0);
});
