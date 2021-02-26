import * as THREE from 'three'
import { valuesEqual } from '../valuesEqual';

test('valuesEqual() with numbers', () => {
  expect(valuesEqual(7, 7)).toBe(true);
  expect(valuesEqual(7, 11)).toBe(false);
});

test('valuesEqual() special numbers are equal', () => {
  expect(valuesEqual(NaN, NaN)).toBe(true);
  expect(valuesEqual(Infinity, Infinity)).toBe(true);
  expect(valuesEqual(Infinity, -Infinity)).toBe(false);
  expect(valuesEqual(NaN, Infinity)).toBe(false);
});

test('valuesEqual() with strings', () => {
  expect(valuesEqual('yeet', 'yeet')).toBe(true);
  expect(valuesEqual('', '')).toBe(true);
  expect(valuesEqual('yeet', 'foo')).toBe(false);
});

test('valuesEqual() with THREE.Vector3', () => {
  const a = new THREE.Vector3(1, 2, 3);
  const b = new THREE.Vector3(1, 2, 3);
  const c = new THREE.Vector3(1, 1, 1);
  expect(valuesEqual(a, a)).toBe(true);
  expect(valuesEqual(a, b)).toBe(true);
  expect(valuesEqual(a, c)).toBe(false);
});

test('valuesEqual() with arrays', () => {
  expect(valuesEqual([1, 2.5, 3], [1, 2.5, 3])).toBe(true);
  expect(valuesEqual([], [])).toBe(true);
  expect(valuesEqual([new THREE.Vector3(1, 2, 3)], [new THREE.Vector3(1, 2, 3)])).toBe(true);
  expect(valuesEqual([7], ['7'])).toBe(false);
  expect(valuesEqual([1, 2], [1])).toBe(false);
  expect(valuesEqual([1], [1, 2])).toBe(false);
  expect(valuesEqual([[1], [[[]]]], [[1], [[[]]]])).toBe(true);
});

test('valuesEqual() with special values', () => {
  expect(valuesEqual(undefined, undefined)).toBe(true);
  expect(valuesEqual(true, true)).toBe(true);
  expect(valuesEqual(false, false)).toBe(true);
  expect(valuesEqual(null, null)).toBe(true);
});

test('valuesEqual() objects not equal', () => {
  expect(valuesEqual({}, {})).toBe(false);
  expect(valuesEqual({a: 1}, {a: 1})).toBe(false);
});

test('valuesEqual() with different types false', () => {
  expect(valuesEqual([], false)).toBe(false);
  expect(valuesEqual(1, true)).toBe(false);
  expect(valuesEqual(7, '7')).toBe(false);
});
