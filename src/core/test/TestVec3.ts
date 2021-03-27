import * as THREE from 'three'
import { Vec3 } from '../Vec3';

test('Vec3 can be created with values', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 2, 3);
  expect(a.x).toEqual(1);
  expect(a.y).toEqual(2);
  expect(a.z).toEqual(3);
});

test('Vec3 can be created with THREE.Vector3', () => {
  Vec3.threeScale = 1;
  const a = new THREE.Vector3(1, 2, 3);
  const b = new Vec3(a);
  expect(b.x).toEqual(1);
  expect(b.y).toEqual(2);
  expect(b.z).toEqual(3);
});

test('Vec3 can be created with THREE.Vector3 and scaled', () => {
  Vec3.threeScale = 2;
  const b = new Vec3(new THREE.Vector3(2, 4, 6));
  expect(b.x).toEqual(1);
  expect(b.y).toEqual(2);
  expect(b.z).toEqual(3);
});

test('Vec3 equality with Vec3', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 2, 3);
  const b = new Vec3(1, 2, 3);
  const c = new Vec3(1, 1, 1);
  expect(a).toEqual(a);
  expect(a).toEqual(b);
  expect(a).not.toEqual(c);
  expect(a.equals(a)).toBe(true);
  expect(a.equals(b)).toBe(true);
  expect(a.equals(c)).toBe(false);
});

test('Vec3 equality with THREE.Vector3', () => {
  Vec3.threeScale = 1;
  const a = new Vec3(1, 2, 3);
  const b = new THREE.Vector3(1, 2, 3);
  const c = new THREE.Vector3(1, 1, 1);
  expect(a).toEqual(a);
  expect(a).toEqual(b);
  expect(a).not.toEqual(c);
  expect(a.equals(a)).toBe(true);
  expect(a.equals(b)).toBe(true);
  expect(a.equals(c)).toBe(false);
});

test('Vec3 equality with THREE.Vector3 scaled', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 2, 3);
  const b = new THREE.Vector3(2, 4, 6);
  const c = new THREE.Vector3(1, 2, 3);
  expect(a.equals(b)).toBe(true);
  expect(a.equals(c)).toBe(false);
});

test('Vec3 equality with other types', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 1, 1);
  expect(a.equals(1)).toBe(false);
  expect(a.equals(null)).toBe(false);
  expect(a.equals(undefined)).toBe(false);
  expect(a.equals({x: 1, y: 1, z: 1})).toBe(false);
});

test('Vec3 to THREE.Vector3', () => {
  Vec3.threeScale = 1;
  const a = new Vec3(1, 2, 3);
  const b = a.newThreeVector3();
  expect(b.equals(new THREE.Vector3(1, 2, 3))).toBe(true);
});

test('Vec3 to THREE.Vector3 scaled', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 2, 3);
  const b = a.newThreeVector3();
  expect(b.equals(new THREE.Vector3(2, 4, 6))).toBe(true);
});

test('Vec3 copyInto()', () => {
  Vec3.threeScale = 1;
  const a = new Vec3(1, 2, 3);
  const b = new THREE.Vector3();
  a.copyInto(b);
  expect(b.equals(new THREE.Vector3(1, 2, 3))).toBe(true);
});

test('Vec3 copyInto() with scale', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 2, 3);
  const b = new THREE.Vector3();
  a.copyInto(b);
  expect(b.equals(new THREE.Vector3(2, 4, 6))).toBe(true);
});

test('Vec3 to array', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(1, 2, 3);
  expect(a.toArray()).toEqual([1, 2, 3]);
});

test('Vec3 length()', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(2, 3, 6);
  expect(a.length()).toEqual(7);
});

test('Vec3 lengthSq()', () => {
  Vec3.threeScale = 2;
  const a = new Vec3(2, 3, 6);
  expect(a.lengthSq()).toEqual(49);
});
