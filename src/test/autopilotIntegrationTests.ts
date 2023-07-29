import * as THREE from 'three';
import { integrationTest, setPaused, withBodyWithName, withSpatialWithName } from './integrationTests';
import { Lifetime, Vec3, LocalProperty } from '../core';
import { Game, Nav } from '../game';
import { Scene, ConnectingLine } from '../graphics';

const gravConstant = 6.67430e-17;
const planetMass = 1 / gravConstant;
const suiteName = 'Autopilot';
const TAU = 2 * Math.PI;

function simpleMissileCase(
  lt: Lifetime, game: Game, scene: Scene,
  result: (result: {[k: string]: number}) => void,
  targetPos: Vec3, targetVel: Vec3,
  subjectPos: Vec3, subjectVel: Vec3,
) {
  let pauseTime = 300;
  game.root.property('pause_at', {nullable: Number}).set(pauseTime);

  const createShip = game.root.action('create_ship', undefined);
  createShip.fire({
    name: 'Target',
    position: targetPos,
    velocity: targetVel,
    radius: 0,
  });
  createShip.fire({
    name: 'Missile',
    position: subjectPos,
    velocity: subjectVel,
    radius: 0,
    max_accel: 10.0,
  });

  const errorLine = new ConnectingLine(lt, 10);
  errorLine.mat.color.set('#808080');
  scene.addObject(lt, errorLine);
  errorLine.visible = false;

  withSpatialWithName(lt, game, 'Missile', ship => {
    withSpatialWithName(lt, game, 'Target', target => {
      game.root.action('pause_on_proximity', undefined).fire({
        a: ship.body.obj,
        b: target.body.obj,
        distance: 0.01,
        velocity: 0.01,
      });
      Nav.applyState(ship.body, {
        scheme: Nav.Scheme.Dock,
        target: target.body,
      });
      scene.subscribe(lt, () => {
        ship.copyPositionInto(errorLine.a);
        target.copyPositionInto(errorLine.b);
        errorLine.visible = true;
        errorLine.update();
      });
      setPaused(game, false);
    });
  });

  game.root.signal('paused', Number).subscribe(lt, t => {
    if (t >= pauseTime) {
      errorLine.mat.color.set('#FF0000');
      console.error('ship failed to approach target');
      result({passed: 0});
    } else {
      errorLine.mat.color.set('#00FF00');
      result({passed: 1, time: t});
    }
  });
}

integrationTest(suiteName, 'quarter turn on flat circular', (lt, game, scene, result) => {
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(1, 0, 0), new Vec3(0, 1, 0),
    new Vec3(0, -1, 0), new Vec3(1, 0, 0),
  );
  game.root.action('create_celestial', undefined).fire({
    name: 'Planet',
    color: '#0040A0',
    radius: 0.1,
    mass: planetMass,
  });
});

integrationTest(suiteName, 'quarter turn on tilted circular', (lt, game, scene, result) => {
  const angle = 0.1 * TAU;
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(1, 0, 0), new Vec3(0, 1, 0),
    new Vec3(0, -1, 0), new Vec3(Math.cos(angle), 0, Math.sin(angle)),
  );
  game.root.action('create_celestial', undefined).fire({
    name: 'Planet',
    color: '#0040A0',
    radius: 0.1,
    mass: planetMass,
  });
});

integrationTest(suiteName, 'half turn on elliptical', (lt, game, scene, result) => {
  const angle = 0.2 * TAU;
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(2, 0, 0), new Vec3(0, 1, -0.2),
    new Vec3(-1, 0.5, 0), new Vec3(Math.cos(angle), 0, Math.sin(angle)),
  );
  game.root.action('create_celestial', undefined).fire({
    name: 'Planet',
    color: '#0040A0',
    radius: 0.1,
    mass: planetMass,
  });
});

integrationTest(suiteName, 'far away from central body', (lt, game, scene, result) => {
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(10, 0, 0), new Vec3(2, 3, 1),
    new Vec3(9, -1, 0), new Vec3(2, 0, 0),
  );
  game.root.action('create_celestial', undefined).fire({
    name: 'Planet',
    color: '#0040A0',
    radius: 0.1,
    mass: planetMass,
  });
});

integrationTest(suiteName, 'target orbiting planet orbiting sun', (lt, game, scene, result) => {
  const angle = 0.15 * TAU;
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(11, 0, 0), new Vec3(0, 1 + Math.cos(angle), Math.sin(angle)),
    new Vec3(0, -10, 0), new Vec3(3, 0, 0),
  );
  game.root.action('create_celestial', undefined).fire({
    name: 'Sun',
    color: '#FFA000',
    radius: 0.1,
    mass: planetMass * 10,
  });
  game.root.action('create_celestial', undefined).fire({
    name: 'Planet',
    color: '#0040A0',
    radius: 0.1,
    mass: planetMass,
    position: new Vec3(10, 0, 0),
    velocity: new Vec3(0, 1, 0),
  });
});
