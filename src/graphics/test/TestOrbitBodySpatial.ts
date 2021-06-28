import { OrbitBodySpatial } from '../OrbitBodySpatial';
import { LocalProperty, assertIsType } from '../../core'
import * as THREE from "three";

const orbitTestData = require('./orbit-test-data.json')

// Looks nice, typechecks, doesn't work
// import * as orbitTestData from './orbit-test-data.json'

const mockParent = {};

function mockBodyManager(time?: number) {
  const manager = {
    get: (_obj: any) => {
      // return object's parent body
      return {};
    },
    game: {
      frameTime: () => {
        return time ?? 0;
      },
    },
  };
  return manager as any;
}

function mockObj() {
  const obj = {
    property: (name: string, _rtType: any) => {
      return obj[name];
    },
    orbit: new LocalProperty([
      1, // semiMajor
      1, // semiMinor
      0, // inclination
      0, // ascendingNode
      0, // periapsis
      0, // baseTime
      1, // periodTime
      mockParent,
    ]),
    mass: new LocalProperty(1),
  } as any;
  return obj;
}

test('OrbitBodySpatial subscribes to mass', () => {
  const obj = mockObj();
  const spatial = new OrbitBodySpatial(mockBodyManager(), obj);
  obj.mass.set(12);
  expect(spatial.getMass()).toEqual(12);
});

test('OrbitBodySpatial has no issue with undefined mass', () => {
  const obj = mockObj();
  const spatial = new OrbitBodySpatial(mockBodyManager(), obj);
  obj.mass.set(undefined);
  expect(spatial.getMass()).toEqual(0);
});

test('OrbitBodySpatial test data available', () => {
  expect(orbitTestData.length).toBeGreaterThan(0);
});

for (let i = 0; i < orbitTestData.length; i++) {
  const testData = orbitTestData[i];
  test('OrbitBodySpatial ' + JSON.stringify(testData), () => {
    const obj = mockObj();
    const spatial = new OrbitBodySpatial(mockBodyManager(testData.at_time), obj);
    // Cut off one element at the end (the parent ID, always 1) and replace it with the mock parent object
    const params = (testData.paramaters.slice(0, -1) as any[]).concat([mockParent])
    assertIsType(params, [Number, Number, Number, Number, Number, Number, Number, Object]);
    obj.orbit.set(params);
    const result = new THREE.Vector3();
    spatial.copyPositionInto(result);
    expect(result).toBeCloseToVec(new THREE.Vector3(
      testData.position[0],
      testData.position[1],
      testData.position[2],
    ));
  });
}
