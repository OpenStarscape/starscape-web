import * as THREE from 'three';
import { Lifetime, TAU } from '../core';
import { Spatial } from '../game'
import { Scene } from './Scene'

function makeOrbitGeom(lt: Lifetime, color: string): THREE.BufferGeometry {
  if (color.length !== 7 || color[0] !== '#') {
    throw Error('Invalid color: ' + color);
  }
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  const points = 48;
  const positions = new Float32Array(points * 3);
  const colors = new Float32Array(points * 4);
  for (let i = 0; i < points; i++) {
    const distance = i ** 2 / (points - 1) ** 2;
    const theta = -distance * TAU * 0.5;
    positions[i * 3 + 0] = Math.cos(theta);
    positions[i * 3 + 1] = Math.sin(theta);
    positions[i * 3 + 2] = 0;
    colors[i * 4 + 0] = r + (1 - r) * distance;
    colors[i * 4 + 1] = g + (1 - g) * distance;
    colors[i * 4 + 2] = b + (1 - b) * distance;
    colors[i * 4 + 3] = 1 - distance;
  }
  const geom = lt.own(new THREE.BufferGeometry());
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  return geom;
}

// this would need to be disposed of/added to a lifetime if they were not global
const lineMaterial = new THREE.LineBasicMaterial({vertexColors: true, transparent: true});
const emptyGeom = new THREE.BufferGeometry();

export function ellipticalOrbit(
  lt: Lifetime,
  scene: Scene,
  spatial: Spatial,
) {
  const orbitLine = new THREE.Line(emptyGeom, lineMaterial);
  orbitLine.visible = false;

  spatial.body.color.subscribeWithValueLifetime(lt, (valueLt, color) => {
    orbitLine.geometry = makeOrbitGeom(valueLt, color);
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
