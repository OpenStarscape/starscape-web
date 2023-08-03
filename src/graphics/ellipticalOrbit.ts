import * as THREE from 'three';
import { Lifetime, TAU } from '../core';
import { Spatial } from '../game'
import { Scene } from './Scene'

function makeRingGeom(verts: number): THREE.BufferGeometry {
  const circleGeom = new THREE.CircleGeometry(1, verts);
  const attrib = circleGeom.getAttribute('position');
  const array = Array.from(attrib.array);
  const itemSize = attrib.itemSize;
  circleGeom.dispose();
  for (let i = 0; i < itemSize; i++) {
    array.shift(); // Shift off the center vertex
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(new Float32Array(array as any), itemSize));
  return result;
}

// NOTE: these would need to be disposed of/added to a lifetime if they were not global
const circleGeom = makeRingGeom(120);

export function ellipticalOrbit(
  lt: Lifetime,
  scene: Scene,
  spatial: Spatial,
) {
  const lineMat = lt.own(new THREE.LineBasicMaterial({color: 'white'}));

  // This is probs a better way: https://stackoverflow.com/a/21742175
  const orbitLine = new THREE.LineLoop(circleGeom, lineMat);
  orbitLine.visible = false;

  spatial.body.color.subscribe(lt, color => {
    lineMat.color.setStyle(color);
  });

  scene.addObject(lt, orbitLine);
  scene.subscribe(lt, () => {
    if (spatial.isReady() && spatial.parent() !== null) {
      orbitLine.visible = spatial.copyOrbitMatrixInto(orbitLine.matrixWorld);
    } else {
      orbitLine.visible = false;
    }
  });
}
