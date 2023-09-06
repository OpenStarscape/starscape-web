import { integrationTest, setPaused, withSpatialWithName } from './integrationTests';
import { Lifetime, Vec3, TAU, G } from '../core';
import { Game, Nav, Spatial, Body } from '../game';
import { SpaceScene, ConnectingLine } from '../graphics';

const maxAccel = 10;
const suiteName = 'Autopilot';
const seekerName = 'Seeker';
const targetName = 'Target';

function createShip(game: Game, name: string, pos: Vec3, vel: Vec3) {
  game.root.action('create_ship', undefined).fire({
    name: name,
    position: pos,
    velocity: vel,
    radius: 0,
    max_accel: maxAccel,
  });
}

type CelesialParams = {
  name: string,
  color: string,
  mass: number,
}
const planetParams = {
  name: 'Planet',
  color: '#0040A0',
  mass: 1 / G,
}
const sunParams = {
  name: 'Sun',
  color: '#FFA000',
  mass: planetParams.mass * 10,
}
function createCelestial(game: Game, params: CelesialParams, pos?: Vec3, vel?: Vec3) {
  game.root.action('create_celestial', undefined).fire({
    name: params.name,
    color: params.color,
    mass: params.mass,
    radius: 0.1,
    position: pos ?? new Vec3(),
    velocity: vel ?? new Vec3(),
  });
}

function pauseOnProximity(game: Game, a: Body, b: Body) {
  game.root.action('pause_on_proximity', undefined).fire({
    a: a.obj,
    b: b.obj,
    distance: 0.01,
    velocity: 0.01,
  });
}

function createErrorLine(lt: Lifetime, scene: SpaceScene, a: Spatial, b: Spatial) {
  const errorLine = new ConnectingLine(lt, 10);
  errorLine.mat.color.set('#808080');
  scene.addObject(lt, errorLine);
  errorLine.visible = false;
  scene.subscribe(lt, () => {
    a.copyPositionInto(errorLine.a);
    b.copyPositionInto(errorLine.b);
    errorLine.visible = true;
    errorLine.update();
  });
}

function passIfPausedBeforeTimeout(lt: Lifetime, game: Game, result: (result: {[k: string]: number}) => void) {
  let pauseTime = 300;
  game.root.property('pause_at', {nullable: Number}).set(pauseTime);
  game.root.signal('paused', Number).subscribe(lt, t => {
    if (t >= pauseTime) {
      console.error('ship failed to approach target');
      result({passed: 0});
    } else {
      result({passed: 1, time: t});
    }
  });
}

function setupApproach(
  lt: Lifetime,
  game: Game,
  scene: SpaceScene,
  subjectName: string,
  objectName: string,
  onDetected: (subjectSpatial: Spatial, objectSpatial: Spatial) => void
) {
  withSpatialWithName(lt, game, subjectName, subjectSpatial => {
    scene.cameraFocusBody.set(subjectSpatial.body);
    withSpatialWithName(lt, game, objectName, objectSpatial => {
      onDetected(subjectSpatial, objectSpatial);
      pauseOnProximity(game, subjectSpatial.body, objectSpatial.body);
      createErrorLine(lt, scene, subjectSpatial, objectSpatial)
      setPaused(game, false);
    });
  });
}

integrationTest(suiteName, 'straight shot', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(0, 0, 0), new Vec3(0, 0, 0));
  createShip(game, targetName, new Vec3(100, 0, 0), new Vec3(0, 0, 0));
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'straight shot with target accel away', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(0, 0, 0), new Vec3(0, 0, 0));
  createShip(game, targetName, new Vec3(100, 0, 0), new Vec3(0, 0, 0));
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    target.body.obj.property('accel', Vec3).set(new Vec3(maxAccel / 2, 0, 0));
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'straight shot with target accel towards', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(0, 0, 0), new Vec3(0, 0, 0));
  createShip(game, targetName, new Vec3(100, 0, 0), new Vec3(0, 0, 0));
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    target.body.obj.property('accel', Vec3).set(new Vec3(-maxAccel / 2, 0, 0));
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'target accel to the side', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(0, 0, 0), new Vec3(0, 0, 0));
  createShip(game, targetName, new Vec3(100, 0, 0), new Vec3(0, 0, 0));
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    target.body.obj.property('accel', Vec3).set(new Vec3(0, maxAccel / 2, 0));
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'target accel to side with inital velocity', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(0, 0, 0), new Vec3(0, 0, 0));
  createShip(game, targetName, new Vec3(100, 0, 0), new Vec3(-30, 0, 30));
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    target.body.obj.property('accel', Vec3).set(new Vec3(0, maxAccel / 2, 0));
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'quarter turn on flat circular', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(0, -1, 0), new Vec3(1, 0, 0));
  createShip(game, targetName, new Vec3(1, 0, 0), new Vec3(0, 1, 0));
  createCelestial(game, planetParams);
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'quarter turn on tilted circular', (lt, game, scene, result) => {
  const angle = 0.1 * TAU;
  createShip(game, seekerName, new Vec3(0, -1, 0), new Vec3(Math.cos(angle), 0, Math.sin(angle)));
  createShip(game, targetName, new Vec3(1, 0, 0), new Vec3(0, 1, 0));
  createCelestial(game, planetParams);
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'half turn on elliptical', (lt, game, scene, result) => {
  const angle = 0.2 * TAU;
  createShip(game, seekerName, new Vec3(-1.1, 0.5, 0), new Vec3(Math.cos(angle), 0, Math.sin(angle)));
  createShip(game, targetName, new Vec3(2, 0, 0), new Vec3(0, 0.8, -0.5));
  createCelestial(game, planetParams);
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'far away from central body', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(9, -1, 0), new Vec3(2, 0, 0));
  createShip(game, targetName, new Vec3(10, 0, 0), new Vec3(2, 3, 1));
  createCelestial(game, planetParams);
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'far away from central body and target', (lt, game, scene, result) => {
  createShip(game, seekerName, new Vec3(-30, -10, 0), new Vec3(0, 0, 0));
  createShip(game, targetName, new Vec3(100, 0, 0), new Vec3(0, 3, 1));
  createCelestial(game, planetParams);
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});

integrationTest(suiteName, 'target orbiting planet orbiting sun', (lt, game, scene, result) => {
  const angle = 0.15 * TAU;
  createShip(game, seekerName, new Vec3(0, -10, 0), new Vec3(3, 0, 0));
  createShip(game, targetName, new Vec3(11, 0, 0), new Vec3(0, 1 + Math.cos(angle), Math.sin(angle)));
  createCelestial(game, sunParams);
  createCelestial(game, planetParams, new Vec3(10, 0, 0), new Vec3(0, 1, 0));
  setupApproach(lt, game, scene, seekerName, targetName, (seeker, target) => {
    Nav.applyState(seeker.body, {
      scheme: Nav.Scheme.Dock,
      target: target.body,
    });
  });
  passIfPausedBeforeTimeout(lt, game, result);
});
