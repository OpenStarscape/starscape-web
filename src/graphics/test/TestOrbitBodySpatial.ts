import { OrbitBodySpatial } from '../OrbitBodySpatial';
import { LocalProperty } from '../../core'
import * as THREE from "three";

const TAU = 2 * Math.PI;

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

/// Distance from center to foci, if semi major is 2 and semi minor is 1
const focusOffset = Math.sqrt(2 * 2 - 1 * 1);

// For these tests base time is 0 and period time is 1
const orbitPositionTests = [
  {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [1, 0, 0],
    mockTime: 0,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [0, 1, 0],
    mockTime: 0.25,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [-1, 0, 0],
    mockTime: 0.5,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [1, 0, 0],
    mockTime: 1,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.1 * TAU,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [1, 0, 0],
    mockTime: 0,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.1 * TAU,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [-1, 0, 0],
    mockTime: 0.5,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0.25 * TAU,
    periapsis: 0,
    expectedPos: [0, 1, 0],
    mockTime: 0,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0,
    periapsis: 0.25 * TAU,
    expectedPos: [0, 0, 1],
    mockTime: 0,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0.1 * TAU,
    periapsis: 0.25 * TAU,
    expectedPos: [0, 0, 1],
    mockTime: 0,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [0, 0, 1],
    mockTime: 0.25,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0.1 * TAU,
    periapsis: 0,
    expectedPos: [0, 0, 1],
    mockTime: 0.25,
  }, {
    semiMajor: 1,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0.3 * TAU,
    periapsis: 0.2 * TAU,
    expectedPos: [-1, 0, 0],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [2 - focusOffset, 0, 0],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0,
    expectedPos: [-2 - focusOffset, 0, 0],
    mockTime: 0.5,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0,
    periapsis: 0.25 * TAU,
    expectedPos: [0, 2 - focusOffset, 0],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0,
    ascendingNode: 0.25 * TAU,
    periapsis: 0.25 * TAU,
    expectedPos: [-2 + focusOffset, 0, 0],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0.1 * TAU,
    ascendingNode: 0.25 * TAU,
    periapsis: 0.5 * TAU,
    expectedPos: [0, -2 + focusOffset, 0],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0.1 * TAU,
    ascendingNode: 0.25 * TAU,
    periapsis: 0.5 * TAU,
    expectedPos: [0, -2 + focusOffset, 0],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0.25 * TAU,
    periapsis: 0.25 * TAU,
    expectedPos: [0, 0, 2 - focusOffset],
    mockTime: 0,
  }, {
    semiMajor: 2,
    semiMinor: 1,
    inclination: 0.25 * TAU,
    ascendingNode: 0.25 * TAU,
    periapsis: 0.25 * TAU,
    expectedPos: [0, 0, -2 - focusOffset],
    mockTime: 0.5,
  },
]

// TODO: test parent's position effects position
// TODO: test non-90 degree angles
// TODO: test that body is at the correct place at correct times on elliptical orbits
// TODO: test that base time and period time have desired effect
// TODO: test velocity

for (const params of orbitPositionTests) {
  test('OrbitBodySpatial position of ' + JSON.stringify(params), () => {
    const obj = mockObj();
    const spatial = new OrbitBodySpatial(mockBodyManager(params.mockTime), obj);
    obj.orbit.set([
      params.semiMajor,
      params.semiMinor,
      params.inclination,
      params.ascendingNode,
      params.periapsis,
      0, // baseTime
      1, // periodTime
      mockParent,
    ]);
    const result = new THREE.Vector3();
    spatial.copyPositionInto(result);
    expect(result).toBeCloseToVec(new THREE.Vector3(
      params.expectedPos[0],
      params.expectedPos[1],
      params.expectedPos[2],
    ));
  });
}
