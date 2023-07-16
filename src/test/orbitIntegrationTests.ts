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
    game.root.property('physics_ticks_per_network_tick', Number).set(0);
    let pause_time = Infinity;
    game.root.property('time', Number).getThen(lt, time => {
      pause_time = time + params.orbit[6];
      game.root.property('pause_at', {nullable: Number}).set(pause_time);
    });
    const createCelestial = game.root
      .action('create_celestial', [String, Vec3, Vec3, Number, Number]);
    const centralMass = params.grav_param / gravConstant;
    createCelestial
      .fire(['Central', new Vec3(), new Vec3(), 0.1, centralMass]);
    const startPos = new Vec3(params.position);
    createCelestial
      .fire(['Satellite', startPos, new Vec3(params.velocity), 0.02, centralMass / 10000]);
    setTimeout(() => {
      game.root.property('physics_ticks_per_network_tick', Number).set(4);
    }, 100);
    game.root.signal('paused', Number).subscribe(lt, t => {
      console.log('paused');
      if (t >= pause_time) {
        console.log('paused after enough time has passed');
        setTimeout(() => {
          createCelestial
            .fire(['Expected', startPos, new Vec3(), 0.02, centralMass / 10000]);
          game.bodies.subscribe(lt, ([_, body]) => {
            body.property('name', {nullable: String}).getThen(lt, name => {
              if (name == 'Satellite') {
                body.property('position', Vec3).getThen(lt, position => {
                  const distance = position.newThreeVector3().distanceTo(startPos.newThreeVector3());
                  const proportional = distance / startPos.newThreeVector3().length();
                  console.log('proportional:', proportional);
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
