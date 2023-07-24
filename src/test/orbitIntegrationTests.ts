import * as THREE from 'three';
import { integrationTest, TestStatus, withBodyWithName } from './integrationTests';
import { Vec3 } from '../core';
import { ConnectingLine } from '../graphics';
import { Spatial } from '../game';

type OrbitTestCase = {
  name: string,
  orbit: [number, number, number, number, number, number, number],
  grav_param: number,
  at_time: number,
  position: [number, number, number],
  velocity: [number, number, number],
};

const orbitTestData: OrbitTestCase[] = require('./orbit-test-data.json')

const gravConstant = 6.67430e-17;

orbitTestData.forEach(params => {
  integrationTest(params.name, (lt, game, scene, status) => {
    game.root.action('reset', null).fire(null);
    game.root.property('time_per_time', Number).set(0);
    let pause_time = Infinity;
    game.root.property('time', Number).getThen(lt, time => {
      pause_time = time + params.orbit[6];
      game.root.property('pause_at', {nullable: Number}).set(pause_time);
    });
    const createCelestial = game.root
      .action('create_celestial', undefined);
    const centralMass = params.grav_param / gravConstant;
    createCelestial.fire({
      name: 'Central',
      color: '#FF8000',
      radius: 0.1,
      mass: centralMass,
    });
    const startPos = new Vec3(params.position);
    createCelestial.fire({
      name: 'Satellite',
      color: '#FFFFFF',
      position: startPos,
      velocity: new Vec3(params.velocity),
      radius: 0.02,
      mass: centralMass / 100000,
    });

    const errorLine = new ConnectingLine(lt, 10);
    errorLine.mat.color.set('#808080');
    scene.addObject(lt, errorLine);
    errorLine.visible = false;
    startPos.copyInto(errorLine.a);
    let satelliteSpatial: Spatial | null = null;
    withBodyWithName(lt, game, 'Satellite', body => {
      const spatial = body.spatial(lt);
      spatial.onReady(() => {
        satelliteSpatial = spatial;
      })
    });
    scene.subscribe(lt, () => {
      if (satelliteSpatial) {
        satelliteSpatial.copyPositionInto(errorLine.b);
        errorLine.visible = true;
        errorLine.update();
      }
    });

    game.root.property('min_roundtrip_time', Number).set(0);
    game.root.property('time_per_time', Number).set(1);
    game.root.signal('paused', Number).subscribe(lt, t => {
      if (t >= pause_time) {
        game.bodies.subscribe(lt, ([_, body]) => {
          body.property('name', {nullable: String}).getThen(lt, name => {
            if (name == 'Satellite') {
              body.property('position', Vec3).getThen(lt, position => {
                const distance = position.newThreeVector3().distanceTo(startPos.newThreeVector3());
                const semiMajor = params.orbit[0];
                const proportional = distance / semiMajor;
                if (proportional < 0.1) {
                  errorLine.mat.color.set('#00FF00');
                  status.set(TestStatus.Passed);
                } else {
                  errorLine.mat.color.set('#FF0000');
                  console.error(
                    'body ended up ' + distance + ' away from expected (' +
                    proportional + ' length of semi-major), which is too much');
                  status.set(TestStatus.Failed);
                }
              });
            }
          });
        });
      }
    });
  });
});
