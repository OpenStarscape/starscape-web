import { OrbitSpatial } from '../OrbitSpatial';
import { DependentLifetime, LocalProperty, assertIsType } from '../../core'
import * as THREE from "three";

const orbitTestData = require('./orbit-test-data.json')
const lt = new DependentLifetime();

// Looks nice, typechecks, doesn't work
// import * as orbitTestData from './orbit-test-data.json'

const mockParent = {};
// TODO: test parent position
const parentPos = new THREE.Vector3();
const parentVel = new THREE.Vector3();

function mockGame(time?: number) {
  return {
    animation: {
      gameTime: () => {
        return time ?? 0;
      },
    },
    getBody: () => {
      return {
        spatial: () => {
          return {
            copyPositionInto: (_vec: THREE.Vector3) => {},
            copyVelocityInto: (_vec: THREE.Vector3) => {},
          }
        }
      }
    },
  } as any;
}

function mockBody() {
  const body = {
    obj: {
      property: (name: string, _rtType: any) => {
        return body[name];
      },
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
  return body;
}

test('OrbitSpatial subscribes to mass', () => {
  const body = mockBody();
  const spatial = new OrbitSpatial(mockGame(), lt, body);
  body.mass.set(12);
  expect(spatial.mass()).toEqual(12);
});

test('OrbitSpatial has no issue with undefined mass', () => {
  const body = mockBody();
  const spatial = new OrbitSpatial(mockGame(), lt, body);
  body.mass.set(undefined);
  expect(spatial.mass()).toEqual(0);
});

test('OrbitSpatial test data available', () => {
  expect(orbitTestData.length).toBeGreaterThan(1);
});

for (let i = 0; i < orbitTestData.length; i++) {
  const testData = orbitTestData[i];
  const body = mockBody();
  const spatial = new OrbitSpatial(mockGame(testData.at_time), lt, body);
  // Add the mock parent at the end
  const params = (testData.orbit as any[]).concat([mockParent])
  assertIsType(params, [Number, Number, Number, Number, Number, Number, Number, Object]);
  body.orbit.set(params);
  test('position at ' + testData.name, () => {
    const result = new THREE.Vector3();
    spatial.copyPositionInto(result);
    expect(result).toBeCloseToVec(new THREE.Vector3(
      testData.position[0],
      testData.position[1],
      testData.position[2],
    ));
  });
  test('velocity at ' + testData.name, () => {
    const result = new THREE.Vector3();
    spatial.copyVelocityInto(result);
    expect(result).toBeCloseToVec(new THREE.Vector3(
      testData.velocity[0],
      testData.velocity[1],
      testData.velocity[2],
    ));
  });
}
