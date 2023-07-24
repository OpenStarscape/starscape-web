import * as THREE from 'three';
import { Lifetime } from '../core';

const unitLineGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
  new THREE.Vector3(1, 1, 1),
]);

function makeMat(dashes: number): THREE.LineBasicMaterial {
  if (dashes > 1) {
    return new THREE.LineDashedMaterial( {
      linewidth: 2,
      color: 'white',
      // * 2 is because each segment has a dash and a gap
      // - 1 is so there's dashes (not gaps) on either end
      // 1.7320508075688772 is the length of a (1, 1, 1) line
      scale: (dashes * 2 - 1) / 1.7320508075688772,
      // dash and gap size should default to 1, they don't seem to
      dashSize: 1,
      gapSize: 1,
    });
  } else {
    return new THREE.LineBasicMaterial( { color: 'white', linewidth: 2 });
  }
}

export class ConnectingLine extends THREE.LineSegments {
  readonly a = new THREE.Vector3();
  readonly b = new THREE.Vector3();
  readonly mat: THREE.LineBasicMaterial;

  constructor(lt: Lifetime, readonly dashes: number) {
    const mat = lt.own(makeMat(dashes));
    super(unitLineGeom, mat);
    this.mat = mat;
    this.computeLineDistances();
  }

  update() {
    this.position.copy(this.a);
    this.scale.copy(this.b);
    this.scale.sub(this.a);
    this.updateMatrix()
    this.updateMatrixWorld()
  }
}
