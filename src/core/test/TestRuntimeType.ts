import * as THREE from 'three';
import { assertIsType, isType, RuntimeType, RuntimeTypeOf, RealTypeOf, typeName } from '../RuntimeType';
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

function isKnownToBe<T>(_: T) {}

function testTypeAssertions<V, T extends RuntimeType = RuntimeTypeOf<V>>(t: T, tName: string) {
  const cases: [unknown, string][] = [
    [null, 'null'],
    [true, 'boolean'],
    [false, 'boolean'],
    [3, 'number'],
    [0, 'number'],
    [-7.5, 'number'],
    ['23', 'string'],
    ['', 'string'],
    [[7, 2], 'array'],
    [[], 'array'],
    [obj(), 'SsObject'],
    [new THREE.Vector3(), 'Vector3']
  ];
  for (const [value, vName] of cases) {
    if (t === undefined || vName === tName) {
      expect(isType(value, t)).toBe(true);
      assertIsType(value, t);
      isKnownToBe<V>(value);
      isKnownToBe<RealTypeOf<T>>(value);
    } else {
      expect(isType(value, t)).toBe(false);
      expect(() => {
        assertIsType(value, t);
      }).toThrow('expected ' + tName + ', got ' + vName);
    }
  }
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

test('type assertions any type', () => {
  testTypeAssertions<any>(undefined, 'any');
});

test('type assertions null', () => {
  testTypeAssertions<null>(null, 'null');
});

test('type assertions boolean', () => {
  testTypeAssertions<boolean>(Boolean, 'boolean');
});

test('type assertions number', () => {
  testTypeAssertions<number>(Number, 'number');
});

test('type assertions string', () => {
  testTypeAssertions<string>(String, 'string');
});

test('type assertions SsObject', () => {
  testTypeAssertions<SsObject>(SsObject, 'SsObject');
});

test('type assertions array of ints', () => {
  testTypeAssertions<number[]>([Number], 'array');
});

test('type assertions array of array 0f array', () => {
  const t = [[[String]]];
  assertIsType([], t);
  assertIsType([[]], t);
  assertIsType([[[]]], t);
  assertIsType([[[''], []], [], [['foo', 'bar', 'baz']]], t);
  expect(() =>
    assertIsType([null], t)
  ).toThrow('inside array: expected array, got null');
  expect(() =>
    assertIsType([[['a']], [false]], t)
  ).toThrow('inside array: inside array: expected array, got boolean');
  expect(() =>
    assertIsType([[['a']], [[false]]], t)
  ).toThrow('inside array: inside array: inside array: expected string, got boolean');
});

test('type assertions Vector3', () => {
  testTypeAssertions<THREE.Vector3>(THREE.Vector3, 'Vector3');
});
