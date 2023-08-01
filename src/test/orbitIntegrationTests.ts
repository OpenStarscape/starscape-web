import { integrationTest, setPaused, withBodyWithName, withSpatialWithName } from './integrationTests';
import { Vec3 } from '../core';
import { ConnectingLine } from '../graphics';

type OrbitTestCase = {
  name: string,
  orbit: [number, number, number, number, number, number, number],
  grav_param: number,
  at_time: number,
  position: [number, number, number],
  velocity: [number, number, number],
};

const orbitTestData: OrbitTestCase[] = require('./orbit-test-data.json');

const gravConstant = 6.67430e-17;
const suiteName = 'Orbit';

orbitTestData.forEach(params => {
  integrationTest(suiteName, params.name, (lt, game, scene, result) => {
    const pauseTime = params.orbit[6];
    game.root.property('pause_at', {nullable: Number}).set(pauseTime);

    const startPos = new Vec3(params.position);
    const createCelestial = game.root
      .action('create_celestial', undefined);
    const centralMass = params.grav_param / gravConstant;
    createCelestial.fire({
      name: 'Central',
      color: '#FF8000',
      radius: 0.1,
      mass: centralMass,
    });
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
    withSpatialWithName(lt, game, 'Satellite', spatial => {
      scene.subscribe(lt, () => {
        spatial.copyPositionInto(errorLine.b);
        errorLine.visible = true;
        errorLine.update();
      });
    });

    game.root.signal('paused', Number).subscribe(lt, t => {
      if (t >= pauseTime) {
        withBodyWithName(lt, game, 'Satellite', body => {
          body.obj.property('position', Vec3).getThen(lt, position => {
            const distance = position.newThreeVector3().distanceTo(startPos.newThreeVector3());
            const semiMajor = params.orbit[0];
            const proportional = distance / semiMajor;
            if (proportional < 0.1) {
              errorLine.mat.color.set('#00FF00');
              result({passed: 1});
            } else {
              errorLine.mat.color.set('#FF0000');
              console.error(
                'body ended up ' + distance + ' away from expected (' +
                proportional + ' length of semi-major), which is too much');
              result({passed: 0});
            }
          });
        });
      }
    });

    setPaused(game, false);
  });
});
