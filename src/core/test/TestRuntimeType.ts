import * as THREE from 'three';
import { assertIsType, isType, RuntimeType, runtimeTypeEquals, RuntimeTypeOf, typeName, runtimeTypeName } from '../RuntimeType';
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

class ValueType<T, R extends RuntimeType> {
  constructor(
    readonly valueStr: string,
    readonly value: T,
    readonly valueTypeName: string,
    readonly rtType: R,
    readonly rtTypeName: string,
  ) {}

  describe() {
    return this.valueStr + ' (' + this.rtTypeName + ')';
  }
}

const types: ValueType<any, any>[] = [
  new ValueType('null',     null,       'null',       null,     'null'),
  //new ValueType(undefined,  'undefined',  undefined,'any'),
  new ValueType('true',     true,       'boolean',    Boolean,  'boolean'),
  new ValueType('false',    false,      'boolean',    Boolean,  'boolean'),
  new ValueType('3',        3,          'number',     Number,   'number'),
  new ValueType('0',        0,          'number',     Number,   'number'),
  new ValueType('-7.5',     -7.5,       'number',     Number,   'number'),
  new ValueType('NaN',      NaN,        'number',     Number,   'number'), // lol
  new ValueType('"23"',     '23',       'string',     String,   'string'),
  new ValueType('""',       '',         'string',     String,   'string'),
  new ValueType('SsObject', obj(),      'SsObject',   SsObject, 'SsObject'),
  new ValueType('THREE.Vector3', new THREE.Vector3(), 'Vector3', THREE.Vector3, 'Vector3'),
  new ValueType('null',     null,       'null',       {nullable: SsObject}, 'SsObject?'),
  new ValueType('"hi"',     'hi',       'string',     {nullable: String}, 'string?'),
  new ValueType('[1, 2, 3]', [1, 2, 3], 'array',      [Number], 'number[]'),
  new ValueType('[[], [[1, 2]]]', [[], [[1, 2]]], 'array',  [[[Number]]], 'number[][][]'),
  new ValueType('[]',       [],         'array',      [String], 'string[]'),
  new ValueType('[null]',   [null],     'array',      [null],   'null[]'),
  new ValueType('[null]',   [null],     'array',      [{nullable: SsObject}], 'SsObject?[]'),
  new ValueType('{}',       {},         'object',     Object,   'Object'),
  new ValueType('{a: "b"}', {a: 'b'},   'object',     Object,   'Object'),
];

for (const vt of types) {
  test('typeName(): ' + vt.describe(), () => {
    expect(typeName(vt.value)).toEqual(vt.valueTypeName);
  });
}

for (const vt of types) {
  test('runtimeTypeName(): ' + vt.describe(), () => {
    expect(
      runtimeTypeName(vt.rtType)
    ).toEqual(vt.rtTypeName);
  });
}

for (const vt of types) {
  test('runtimeTypeEquals(): ' + vt.describe() + ' equals itself', () => {
    expect(
      runtimeTypeEquals(vt.rtType, vt.rtType)
    ).toBe(true);
  });
}

for (const vt of types) {
  test('runtimeTypeEquals(): ' + vt.describe(), () => {
    for (const otherVt of types) {
      expect(
        runtimeTypeEquals(vt.rtType, otherVt.rtType)
      ).toBe(vt.rtTypeName === otherVt.rtTypeName);
    }
  });
}

for (const vt of types) {
  test('isType() & assertIsType(): ' + vt.describe(), () => {
    for (const otherVt of types) {
      // by no means perfect, just enough to get the tests to work
      let shouldMatch = (
        vt.rtTypeName === otherVt.rtTypeName ||
        vt.valueTypeName === otherVt.rtTypeName ||
        (otherVt.rtTypeName.endsWith('?') && otherVt.rtTypeName.startsWith(vt.valueTypeName)) ||
        (vt.valueStr === '[]' && otherVt.rtTypeName.endsWith('[]')) ||
        (vt.valueStr === 'null' && otherVt.rtTypeName.endsWith('?')) ||
        (vt.valueStr === 'null' && otherVt.rtTypeName === 'null') ||
        (vt.valueStr === '[null]' && otherVt.rtTypeName.endsWith('?[]')) ||
        (vt.valueStr === '[null]' && otherVt.rtTypeName === 'null[]')
      );
      if (isType(vt.value, otherVt.rtType) !== shouldMatch) {
        expect(vt.describe() + ' unexpectidly does ' + (shouldMatch ? 'not ' : '') + 'match ' + otherVt.rtTypeName).toBe(null);
      }
      if (shouldMatch) {
        expect(() => {
          assertIsType(vt.value, otherVt.rtType);
        }).not.toThrow();
      } else {
        let message = 'expected ' + otherVt.rtTypeName + ', got ' + vt.valueTypeName;
        if (Array.isArray(vt.value) && Array.isArray(otherVt.rtType)) {
          message = '';
        }
        expect(() => {
          assertIsType(vt.value, otherVt.rtType);
        }).toThrow(message);
      }
    }
  });
}

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
