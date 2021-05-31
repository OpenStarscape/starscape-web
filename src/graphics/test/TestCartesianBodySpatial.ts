import { CartesianBodySpatial } from '../CartesianBodySpatial';
import { LocalProperty, Vec3 } from '../../core'
import * as THREE from "three";

const mockBodyManager = new Map() as any;
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

test('CartesianBodySpatial subscribes to position', () => {
  const obj = mockObj();
  const spatial = new CartesianBodySpatial(mockBodyManager, obj);
  obj.position.set(new Vec3(1, 2, 3));
  const result = new THREE.Vector3();
  spatial.copyPositionInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3(1, 2, 3));
});

test('CartesianBodySpatial has no issue with undefined position', () => {
  const obj = mockObj();
  const spatial = new CartesianBodySpatial(mockBodyManager, obj);
  obj.position.set(undefined);
  const result = new THREE.Vector3();
  spatial.copyVelocityInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3());
});

test('CartesianBodySpatial subscribes to velocity', () => {
  const obj = mockObj();
  const spatial = new CartesianBodySpatial(mockBodyManager, obj);
  obj.velocity.set(new Vec3(1, 2, 3));
  const result = new THREE.Vector3();
  spatial.copyVelocityInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3(1, 2, 3));
});

test('CartesianBodySpatial has no issue with undefined velocity', () => {
  const obj = mockObj();
  const spatial = new CartesianBodySpatial(mockBodyManager, obj);
  obj.velocity.set(undefined);
  const result = new THREE.Vector3();
  spatial.copyVelocityInto(result);
  expect(result).toBeCloseToVec(new THREE.Vector3());
});

test('CartesianBodySpatial subscribes to mass', () => {
  const obj = mockObj();
  const spatial = new CartesianBodySpatial(mockBodyManager, obj);
  obj.mass.set(12);
  expect(spatial.getMass()).toBe(12);
});

test('CartesianBodySpatial has no issue with undefined mass', () => {
  const obj = mockObj();
  const spatial = new CartesianBodySpatial(mockBodyManager, obj);
  obj.mass.set(undefined);
  expect(spatial.getMass()).toBe(0);
});
