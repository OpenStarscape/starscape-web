import * as THREE from 'three';
import { Lifetime, LocalProperty } from '../core';
import type { Spatial } from '../game'
import type { Scene } from './Scene'

// NOTE: these would need to be disposed of/added to a lifetime if they were not global
const emptyGeom = new THREE.BufferGeometry();

/// A mesh that never shrinks below a minimum size on the screen no matter how small/far away it is
export function scalingMesh(
  lt: Lifetime,
  scene: Scene,
  spatial: Spatial,
  geomProp: LocalProperty<[geom: THREE.BufferGeometry | null, size: number]>,
  updateQuat: ((quat: THREE.Quaternion) => void) | null,
  children: THREE.Object3D[],
) {
  let size = 1;
  const solidMat = lt.own(new THREE.MeshBasicMaterial({color: 'white'}));
  const wireMat = lt.own(new THREE.MeshBasicMaterial({color: 'white', wireframe: true}));
  const mesh = new THREE.Mesh(emptyGeom, wireMat);
  mesh.visible = false;
  for (const child of children) {
    mesh.add(child);
  }
  mesh.matrixAutoUpdate = false;
  spatial.body.color.subscribe(lt, color => {
    wireMat.color.setStyle(color);
    solidMat.color.setStyle(color);
  });
  geomProp.subscribe(lt, ([geom, newSize]) => {
    if (geom === null) {
      mesh.visible = false;
    } else {
      mesh.visible = true;
      size = newSize;
      mesh.geometry = geom;
    }
  });
  scene.addObject(lt, mesh);
  scene.subscribe(lt, () => {
    spatial.copyPositionInto(mesh.position);
    const dist = mesh.position.distanceTo(scene.camera.position);
    const scale = dist / 100 / size;
    if (scale > 1) {
      mesh.scale.setScalar(scale);
      mesh.material = solidMat;
    } else {
      mesh.scale.setScalar(1);
      mesh.material = wireMat;
    }
    if (updateQuat !== null) {
      updateQuat(mesh.quaternion);
    }
    mesh.updateMatrix();
  });
}
