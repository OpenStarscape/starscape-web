import * as THREE from 'three';
import { integrationTest, TestStatus, withBodyWithName, withSpatialWithName } from './integrationTests';
import { Vec3 } from '../core';
import { Nav } from '../game';
import { ConnectingLine } from '../graphics';

const gravConstant = 6.67430e-17;
const suiteName = 'Autopilot';

integrationTest(suiteName, 'catches up quarter turn on flat circular', (lt, game, scene, status) => {
  let pause_time = 20;
  game.root.property('time', Number).getThen(lt, time => {
    pause_time += time;
    game.root.property('pause_at', {nullable: Number}).set(pause_time);
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
    position: new Vec3(1, 0, 0),
    velocity: new Vec3(0, 1, 0),
  });
  createShip.fire({
    name: 'Ship',
    position: new Vec3(0, -1, 0),
    velocity: new Vec3(1, 0, 0),
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
      game.root.property('min_roundtrip_time', Number).set(0);
      game.root.property('time_per_time', Number).set(100);
    });
  });

  game.root.signal('paused', Number).subscribe(lt, t => {
    if (t >= pause_time) {
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
});
