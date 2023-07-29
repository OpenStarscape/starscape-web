import * as THREE from 'three';
import { integrationTest, setPaused, withBodyWithName, withSpatialWithName } from './integrationTests';
import { Lifetime, Vec3, LocalProperty } from '../core';
import { Game, Nav } from '../game';
import { Scene, ConnectingLine } from '../graphics';

const gravConstant = 6.67430e-17;
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

  const createCelestial = game.root.action('create_celestial', undefined);
  const createShip = game.root.action('create_ship', undefined);

  const planetMass = 1 / gravConstant;
  createCelestial.fire({
    name: 'Planet',
    color: '#0040A0',
    radius: 0.1,
    mass: planetMass,
  });
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
    max_accel: 0.1,
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
      result({time: t});
    }
  });
}

integrationTest(suiteName, 'quarter turn on flat circular', (lt, game, scene, result) => {
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(1, 0, 0), new Vec3(0, 1, 0),
    new Vec3(0, -1, 0), new Vec3(1, 0, 0),
  );
});

integrationTest(suiteName, 'quarter turn on tilted circular', (lt, game, scene, result) => {
  const angle = 0.1 * TAU;
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(1, 0, 0), new Vec3(0, 1, 0),
    new Vec3(0, -1, 0), new Vec3(Math.cos(angle), 0, Math.sin(angle)),
  );
});

integrationTest(suiteName, 'far away from central body', (lt, game, scene, result) => {
  simpleMissileCase(
    lt, game, scene, result,
    new Vec3(10, 0, 0), new Vec3(2, 3, 1),
    new Vec3(9, -1, 0), new Vec3(2, 0, 0),
  );
});
