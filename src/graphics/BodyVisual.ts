import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3, LocalProperty } from '../core';
import { SsObject } from "../protocol";
import { bodyHUD } from "../ui";
import { ellipticalOrbit } from './ellipticalOrbit'
import { scalingMesh } from './scalingMesh'
import type { Body, Game } from '../game'
import type { Scene } from './Scene'

const yVec = new THREE.Vector3(0, 1, 0);

function newCelestialVisual(scene: Scene, lt: Lifetime, body: Body) {
  const colorProp = new LocalProperty('#ffffff');
  body.color.subscribe(lt, color => {
    // Set color using a Starscape protocol color (starts with 0x...)
    color = '#' + color.slice(2);
    colorProp.set(color);
  });

  const geomProp = new LocalProperty<[geom: THREE.BufferGeometry | null, size: number]>([null, 1]);
  body.size.getThen(lt, km => {
    geomProp.set([lt.own(new THREE.SphereBufferGeometry(km, 16, 16)), km]);
  });

  const spatial = body.spatial(lt);
  const hudElement = new CSS2DObject(bodyHUD(lt, spatial, colorProp));
  ellipticalOrbit(lt, scene, spatial, colorProp);
  scalingMesh(lt, scene, spatial, colorProp, geomProp, null, [hudElement]);
}

function newShipVisual(scene: Scene, lt: Lifetime, body: Body) {
  const direction = new THREE.Vector3();
  let accel: Vec3 | undefined;
  body.obj.property('accel', Vec3).subscribe(lt, newAccel => {
    accel = newAccel;
  });
  const spatial = body.spatial(lt);
  const updateQuat = (q: THREE.Quaternion) => {
    if (accel !== undefined) {
      accel.copyInto(direction);
    }
    if (direction.lengthSq() < 0.0005 && spatial.isReady()) {
      spatial.copyVelocityInto(direction);
    }
    direction.normalize();
    q.setFromUnitVectors(yVec, direction);
  };

  const colorProp = new LocalProperty('#ffffff');
  const geomProp = new LocalProperty<[geom: THREE.BufferGeometry | null, size: number]>([
    lt.own(new THREE.ConeBufferGeometry(0.01, 0.03, 16)),
    0.01
  ]);

  const hudElement = new CSS2DObject(bodyHUD(lt, spatial, colorProp));
  ellipticalOrbit(lt, scene, spatial, colorProp);
  scalingMesh(lt, scene, spatial, colorProp, geomProp, updateQuat, [hudElement]);
}

export function newBodyVisual(scene: Scene, game: Game, obj: SsObject) {
  const lt = scene.lt.addDependent(obj.newDependent());
  const body = game.getBody(obj);
  obj.property('class', String).getThen(lt, cls => {
    if (cls === 'celestial') {
      newCelestialVisual(scene, lt, body);
    } else if (cls === 'ship') {
      newShipVisual(scene, lt, body);
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
