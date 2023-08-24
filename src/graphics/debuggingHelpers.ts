import { Lifetime } from '../core';
import * as THREE from 'three';

export function axisVisualizer(lt: Lifetime, parent: THREE.Object3D) {
  const redMat = lt.own(new THREE.MeshBasicMaterial({color: 'red'}));
  const greenMat = lt.own(new THREE.MeshBasicMaterial({color: 'green'}));
  const blueMat = lt.own(new THREE.MeshBasicMaterial({color: 'blue'}));
  const coneGeom = lt.own(new THREE.ConeGeometry(1, 3, 16));
  coneGeom.translate(0, 3, 0);
  const xMesh = new THREE.Mesh(coneGeom, redMat);
  const yMesh = new THREE.Mesh(coneGeom, greenMat);
  const zMesh = new THREE.Mesh(coneGeom, blueMat);
  xMesh.rotateZ(-Math.PI / 2);
  zMesh.rotateX(Math.PI / 2);
  xMesh.matrixAutoUpdate = true;
  xMesh.matrixWorldAutoUpdate = true;
  yMesh.matrixAutoUpdate = true;
  yMesh.matrixWorldAutoUpdate = true;
  zMesh.matrixAutoUpdate = true;
  zMesh.matrixWorldAutoUpdate = true;
  parent.add(xMesh);
  parent.add(yMesh);
  parent.add(zMesh);
  lt.addCallback(() => {
    parent.remove(xMesh);
    parent.remove(yMesh);
    parent.remove(zMesh);
  })
}
