import { integrationTest } from './integrationTests';
import { Vec3 } from '../core';

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
  integrationTest(params.name, (lt, game, completed) => {
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
      color: '0xFF8000',
      radius: 0.1,
      mass: centralMass,
    });
    const startPos = new Vec3(params.position);
    createCelestial.fire({
      name: 'Satellite',
      color: '0xFFFFFF',
      position: startPos,
      velocity: new Vec3(params.velocity),
      radius: 0.02,
      mass: centralMass / 100000,
    });
    game.root.property('min_roundtrip_time', Number).set(0);
    setTimeout(() => {
      game.root.property('time_per_time', Number).set(100);
    }, 100);
    game.root.signal('paused', Number).subscribe(lt, t => {
      if (t >= pause_time) {
        setTimeout(() => {
          createCelestial.fire({
            name: 'Expected',
            color: '0x00FF00',
            position: startPos,
            radius: 0.02,
            mass: centralMass / 100000,
          });
          game.bodies.subscribe(lt, ([_, body]) => {
            body.property('name', {nullable: String}).getThen(lt, name => {
              if (name == 'Satellite') {
                body.property('position', Vec3).getThen(lt, position => {
                  const distance = position.newThreeVector3().distanceTo(startPos.newThreeVector3());
                  const proportional = distance / startPos.newThreeVector3().length();
                  completed(proportional < 0.1);
                });
              }
            });
          });
        }, 100);
      }
    });
  });
});
