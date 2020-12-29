import * as THREE from "three";

function randRange(start, end) {
  start = Math.floor(start);
  end = Math.ceil(end);
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

/// Adds a stary background to a 3D scene.
export default class Starfield {
  constructor(scene) {
    const RAND_RANGE_START = -1000;
    const RAND_RANGE_END = 1000;

    for(let i = 0; i < 500; i++) {
      const dotGeometry = new THREE.Geometry();
      const dotMaterial = new THREE.PointsMaterial();
      const dot = new THREE.Points(dotGeometry, dotMaterial);

      dotGeometry.vertices.push(new THREE.Vector3());

      let position = new THREE.Vector3(
        randRange(RAND_RANGE_START, RAND_RANGE_END),
        randRange(RAND_RANGE_START, RAND_RANGE_END),
        randRange(RAND_RANGE_START, RAND_RANGE_END));
      position.normalize()
      position.multiplyScalar(randRange(300, 1000));
      dot.position.x = position.x;
      dot.position.y = position.y;
      dot.position.z = position.z;

      scene.add(dot);
    }
  }
}
