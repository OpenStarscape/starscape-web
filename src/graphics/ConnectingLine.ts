import * as THREE from 'three';

const delta = new THREE.Vector3();
const yVec = new THREE.Vector3(0, 1, 0);

const unitLineGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
  new THREE.Vector3(0, 1, 0),
]);

export class ConnectingLine {
  readonly line;
  readonly a = new THREE.Vector3();
  readonly b = new THREE.Vector3();

  constructor(mat: THREE.LineBasicMaterial) {
    this.line = new THREE.LineSegments(unitLineGeom, mat);
  }

  update() {
    this.line.position.copy(this.a);
    delta.copy(this.b);
    delta.sub(this.a);
    const len = delta.length();
    delta.divideScalar(len);
    this.line.quaternion.setFromUnitVectors(yVec, delta);
    this.line.scale.set(len, len, len);
    this.line.computeLineDistances();
    this.line.updateMatrix()
    this.line.updateMatrixWorld()
  }
}
