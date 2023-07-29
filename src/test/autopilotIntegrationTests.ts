import * as THREE from 'three';
import { integrationTest, setPaused, TestStatus, withBodyWithName, withSpatialWithName } from './integrationTests';
import { Lifetime, Vec3, LocalProperty } from '../core';
import { Game, Nav } from '../game';
import { Scene, ConnectingLine } from '../graphics';

const gravConstant = 6.67430e-17;
const suiteName = 'Autopilot';
const TAU = 2 * Math.PI;

function simpleMissileCase(
  lt: Lifetime, game: Game, scene: Scene, status: LocalProperty<TestStatus>,
  targetPos: Vec3, targetVel: Vec3,
  subjectPos: Vec3, subjectVel: Vec3,
  pauseTime: number
) {
  game.root.property('time', Number).getThen(lt, time => {
    pauseTime += time;
    game.root.property('pause_at', {nullable: Number}).set(pauseTime);
  });

  const createCelestial = game.root.action('create_celestial', undefined);
  const createShip = game.root.action('create_ship', undefined);

  const centralMass = 1 / gravConstant;
  createCelestial.fire({
    name: 'Central',
    color: '#FF8000',
    radius: 0.1,
    mass: centralMass,
  });
  createShip.fire({
    name: 'Target',
    position: targetPos,
    velocity: targetVel,
  });
  createShip.fire({
    name: 'Ship',
    position: subjectPos,
    velocity: subjectVel,
  });

  const errorLine = new ConnectingLine(lt, 10);
  errorLine.mat.color.set('#808080');
  scene.addObject(lt, errorLine);
  errorLine.visible = false;

  withSpatialWithName(lt, game, 'Ship', ship => {
    withSpatialWithName(lt, game, 'Target', target => {
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
      withBodyWithName(lt, game, 'Ship', ship => {
        withBodyWithName(lt, game, 'Target', target => {
          ship.obj.property('position', Vec3).getThen(lt, shipPos => {
            target.obj.property('position', Vec3).getThen(lt, targetPos => {
              const distance = shipPos.newThreeVector3().distanceTo(targetPos.newThreeVector3());
              if (distance < 0.1) {
                errorLine.mat.color.set('#00FF00');
                status.set(TestStatus.Passed);
              } else {
                errorLine.mat.color.set('#FF0000');
                console.error('ship ended up ' + distance + ' away from target, which is too much');
                status.set(TestStatus.Failed);
              }
            });
          });
        });
      });
    }
  });
}

integrationTest(suiteName, 'catches up quarter turn on flat circular', (lt, game, scene, status) => {
  simpleMissileCase(
    lt, game, scene, status,
    new Vec3(1, 0, 0), new Vec3(0, 1, 0),
    new Vec3(0, -1, 0), new Vec3(1, 0, 0),
    20
  );
});

integrationTest(suiteName, 'catches up quarter turn on tilted circular', (lt, game, scene, status) => {
  const angle = 0.1 * TAU;
  simpleMissileCase(
    lt, game, scene, status,
    new Vec3(1, 0, 0), new Vec3(0, 1, 0),
    new Vec3(0, -1, 0), new Vec3(Math.cos(angle), 0, Math.sin(angle)),
    20
  );
});
