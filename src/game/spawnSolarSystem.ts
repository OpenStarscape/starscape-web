import * as THREE from 'three';
import { Game } from '.';
import { Vec3 } from '../core';
import { OrbitParams } from './OrbitParams';

const gravConstant = 6.67430e-17;
const TAU = 2 * Math.PI;
const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();

function spawnBody(game: Game, data: any, parent: any, scale: number, timeOffset: number) {
  const props = {
    name: data.name,
    color: data.color,
    radius: data.radius,
    mass: data.mass,
  } as any;
  if (data.position !== undefined) {
    props.position = new Vec3(
      data.position[0] * scale,
      data.position[1] * scale,
      data.position[2] * scale,
    );
  }
  if (data.velocity !== undefined) {
    props.velocity = new Vec3(data.velocity);
    // Don't scale velocity
  }
  if (data.semi_major_axis !== undefined) {
    const semiMajor = data.semi_major_axis * scale;
    const semiMinor = data.semi_minor_axis ? (data.semi_minor_axis * scale) : semiMajor;
    const inclination = data.inclination_angle ?? 0;
    const ascendingNode = data.ascending_node_angle ?? 0;
    const periapsis = data.periapsis_angle ?? 0;
    const baseTime = data.base_time ?? 0;
    const periodTime = TAU * Math.sqrt((semiMajor ** 3) / (parent.mass * gravConstant));
    console.log('periodTime', periodTime);
    const params = new OrbitParams();
    params.setParams(semiMajor, semiMinor, inclination, ascendingNode, periapsis, baseTime, periodTime);
    params.ensureCache(timeOffset);
    props.position = new Vec3(params.cachedPosition);
    props.velocity = new Vec3(params.cachedVelocity);
  }
  if (!props.position || !props.velocity) {
    throw Error('no position or velocity for ' + JSON.stringify(data));
  }

  props.mass *= scale;
  props.radius *= scale;

  (props.position as Vec3).copyInto(tmpVecA);
  tmpVecB.setScalar(0);
  if (parent) {
    (parent.position as Vec3).copyInto(tmpVecB);
  }
  tmpVecA.add(tmpVecB);
  props.position = new Vec3(tmpVecA);

  (props.velocity as Vec3).copyInto(tmpVecA);
  tmpVecB.setScalar(0);
  if (parent) {
    (parent.velocity as Vec3).copyInto(tmpVecB);
  }
  tmpVecA.add(tmpVecB);
  props.velocity = new Vec3(tmpVecA);

  game.root.action('create_celestial', undefined).fire(props);

  console.log(props.position);
  if (data.children) {
    data.children.forEach((body: any) => {
      spawnBody(game, body, props, scale, 0);
    });
  }
}

function spawnFromJson(game: Game, json: any, scale: number) {
  const bodies = json.bodies;
  bodies.forEach((body: any) => {
    spawnBody(game, body, null, scale, 0);
  });
}

// Fetches data from solar-system.json
export function spawnSolarSystem(game: Game) {
  fetch('solar-system.json')
  .then(response => response.json())
  .then(json => {
    spawnFromJson(game, json, 0.000001);
  }).catch(e => {
    console.error('problem fetching solar system: ' + e.message);
  });
}
