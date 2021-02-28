import * as THREE from 'three';
import { typeFilter, typeName } from '../RuntimeType';
import { SsObject } from '../../protocol';

const mockConn = {
  lifetime: () => {
    return {
      add: (_d: any) => {}
    };
  },
} as any;

function obj() {
  return new SsObject(mockConn, 88);
}

test('typeName primitives', () => {
  expect(typeName(7)).toEqual('number');
  expect(typeName(-7.5)).toEqual('number');
  expect(typeName(true)).toEqual('boolean');
  expect(typeName(false)).toEqual('boolean');
  expect(typeName('')).toEqual('string');
  expect(typeName('foo')).toEqual('string');
});

test('typeName special values', () => {
  expect(typeName(null)).toEqual('null');
  expect(typeName(undefined)).toEqual('undefined');
  expect(typeName(Infinity)).toEqual('number');
  expect(typeName(NaN)).toEqual('number'); // lol
});

test('typeName classes', () => {
  expect(typeName(new THREE.Vector3)).toEqual('Vector3');
  expect(typeName(obj())).toEqual('SsObject');
});

test('typeName objects', () => {
  expect(typeName({})).toEqual('object');
  expect(typeName({a: 'b'})).toEqual('object');
});

test('typeName objects with weird constructors', () => {
  expect(typeName({ constructor: null })).toEqual('object');
  expect(typeName({ constructor: true })).toEqual('object');
  expect(typeName({ constructor: undefined })).toEqual('object');
  expect(typeName({ constructor: 'abc' })).toEqual('object');
  expect(typeName({ constructor: {} })).toEqual('object');
  expect(typeName({ constructor: { name: null } })).toEqual('object');
  expect(typeName({ constructor: { name: 75 } })).toEqual('object');
  typeName({ constructor: function () {}}); // doesn't have defined output but should not crash'
});

test('typeName arrays', () => {
  expect(typeName([])).toEqual('array');
  expect(typeName([1, 2, 3])).toEqual('array');
});

test('typeFilter any type', () => {
  const f: (_: unknown) => any = typeFilter(undefined);
  f(null);
  f(true);
  f(false);
  f(false);
  f(5);
  f('hi');
  f(obj());
  f([7]);
  f(new THREE.Vector3());
});

test('typeFilter null', () => {
  const f: (_: unknown) => null = typeFilter(null);
  f(null);
  expect(() => f(false)).toThrow('expected null, got boolean');
  expect(() => f(3)).toThrow('expected null, got number');
  expect(() => f('hi')).toThrow('expected null, got string');
  expect(() => f(obj())).toThrow('expected null, got SsObject');
  expect(() => f([7])).toThrow('expected null, got array');
  expect(() => f(new THREE.Vector3())).toThrow('expected null, got Vector3');
});

test('typeFilter boolean', () => {
  const f: (_: unknown) => boolean = typeFilter(Boolean);
  f(true);
  f(false);
  expect(() => f(null)).toThrow('expected boolean, got null');
  expect(() => f(3)).toThrow('expected boolean, got number');
  expect(() => f('hi')).toThrow('expected boolean, got string');
  expect(() => f(obj())).toThrow('expected boolean, got SsObject');
  expect(() => f([7])).toThrow('expected boolean, got array');
  expect(() => f(new THREE.Vector3())).toThrow('expected boolean, got Vector3');
});

test('typeFilter number', () => {
  const f: (_: unknown) => number = typeFilter(Number);
  f(0);
  f(88);
  f(12.5);
  f(-2);
  expect(() => f(null)).toThrow('expected number, got null');
  expect(() => f(false)).toThrow('expected number, got boolean');
  expect(() => f('hi')).toThrow('expected number, got string');
  expect(() => f(obj())).toThrow('expected number, got SsObject');
  expect(() => f([7])).toThrow('expected number, got array');
  expect(() => f(new THREE.Vector3())).toThrow('expected number, got Vector3');
});

test('typeFilter string', () => {
  const f: (_: unknown) => string = typeFilter(String);
  f('');
  f('hi');
  expect(() => f(null)).toThrow('expected string, got null');
  expect(() => f(false)).toThrow('expected string, got boolean');
  expect(() => f(3)).toThrow('expected string, got number');
  expect(() => f(obj())).toThrow('expected string, got SsObject');
  expect(() => f([7])).toThrow('expected string, got array');
  expect(() => f(new THREE.Vector3())).toThrow('expected string, got Vector3');
});

test('typeFilter SsObject', () => {
  const f: (_: unknown) => SsObject = typeFilter(SsObject);
  f(obj());
  expect(() => f(null)).toThrow('expected SsObject, got null');
  expect(() => f(false)).toThrow('expected SsObject, got boolean');
  expect(() => f(3)).toThrow('expected SsObject, got number');
  expect(() => f('hi')).toThrow('expected SsObject, got string');
  expect(() => f([7])).toThrow('expected SsObject, got array');
  expect(() => f(new THREE.Vector3())).toThrow('expected SsObject, got Vector3');
});

test('typeFilter array', () => {
  const f: (_: unknown) => number[] = typeFilter([Number]);
  f([1, 2, 3]);
  f([]);
  expect(() => f(null)).toThrow('expected array, got null');
  expect(() => f(false)).toThrow('expected array, got boolean');
  expect(() => f(3)).toThrow('expected array, got number');
  expect(() => f('hi')).toThrow('expected array, got string');
  expect(() => f(obj())).toThrow('expected array, got SsObject');
  expect(() => f(new THREE.Vector3())).toThrow('expected array, got Vector3');
});

test('typeFilter array inner type', () => {
  const f: (_: unknown) => number[] = typeFilter([Number]);
  f([1, 2, 3]);
  expect(() => f([1, null, 3])).toThrow('inside array: expected number, got null');
  expect(() => f([false])).toThrow('inside array: expected number, got boolean');
  expect(() => f([1, '2', 3])).toThrow('inside array: expected number, got string');
  expect(() => f([obj()])).toThrow('inside array: expected number, got SsObject');
  expect(() => f([[]])).toThrow('inside array: expected number, got array');
  expect(() => f([new THREE.Vector3()])).toThrow('inside array: expected number, got Vector3');
});

test('typeFilter array of array 0f array', () => {
  const f: (_: unknown) => string[][][] = typeFilter([[[String]]]);
  f([]);
  f([[]]);
  f([[[]]]);
  f([[[''], []], [], [['foo', 'bar', 'baz']]]);
  expect(() => f([null])).toThrow('inside array: expected array, got null');
  expect(() => f([[['a']], [false]])).toThrow('inside array: inside array: expected array, got boolean');
  expect(() => f([[['a']], [[false]]])).toThrow('inside array: inside array: inside array: expected string, got boolean');
});

test('typeFilter Vector3', () => {
  const f: (_: unknown) => THREE.Vector3 = typeFilter(THREE.Vector3);
  f(new THREE.Vector3());
  expect(() => f(null)).toThrow('expected Vector3, got null');
  expect(() => f(false)).toThrow('expected Vector3, got boolean');
  expect(() => f(3)).toThrow('expected Vector3, got number');
  expect(() => f('hi')).toThrow('expected Vector3, got string');
  expect(() => f(obj())).toThrow('expected Vector3, got SsObject');
  expect(() => f([7])).toThrow('expected Vector3, got array');
});
