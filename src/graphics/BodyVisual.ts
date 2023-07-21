import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3, Conduit } from '../core';
import { SsObject } from "../protocol";
import { bodyHUD } from "../ui";
import { ellipticalOrbit } from './ellipticalOrbit'
import type { Game, Spatial } from '../game'
import type { Scene } from './Scene'

const yVec = new THREE.Vector3(0, 1, 0);
const emptyGeom = new THREE.BufferGeometry();

function createColorMaterialPair(
  lt: Lifetime,
  color: Conduit<string>
): [THREE.Material, THREE.Material] {
  const solidMat = lt.own(new THREE.MeshBasicMaterial({color: 'white'}));
  const wireMat = lt.own(new THREE.MeshBasicMaterial({color: 'white', wireframe: true}));
  color.subscribe(lt, color => {
    solidMat.color.setStyle(color);
    wireMat.color.setStyle(color);
  });
  return [solidMat, wireMat];
}

function createCelestialGeom(lt: Lifetime, mesh: THREE.Mesh, size: number) {
  mesh.geometry = lt.own(new THREE.SphereGeometry(size, 16, 16));
}

function createShipGeom(lt: Lifetime, mesh: THREE.Mesh, size: number) {
  mesh.geometry = lt.own(new THREE.ConeGeometry(1 * size, 3 * size, 16));
}

function object3DAddChild(lt: Lifetime, parent: THREE.Object3D, child: THREE.Object3D) {
  parent.add(child);
  // The mesh is removed from the scene when the lifetime dies, unclear why that doesn't remove
  // children but it doesn't.
  lt.addCallback(() => {
    parent.remove(child);
  });
}

function scaleMeshToView(
  scene: Scene,
  mesh: THREE.Mesh,
  size: number,
  farMat: THREE.Material | null,
  closeMat: THREE.Material | null,
) {
  const dist = mesh.position.distanceTo(scene.camera.position);
  const scale = dist / 100 / size;
  if (scale > 1) {
    mesh.scale.setScalar(scale);
    if (farMat) {
      mesh.material = farMat;
    }
  } else {
    mesh.scale.setScalar(1);
    if (closeMat) {
      mesh.material = closeMat;
    }
  }
}

function pointObject3DInDirection(object: THREE.Object3D, direction: THREE.Vector3) {
  direction.normalize();
  object.quaternion.setFromUnitVectors(yVec, direction);
}

function createThrustIndicator(lt: Lifetime, scene: Scene, spatial: Spatial) {
  const mat = lt.own(new THREE.MeshBasicMaterial({color: 0xFFA000}));
  const geom = lt.own(new THREE.ConeGeometry(0.0007, 0.01, 5));
  geom.translate(0, 0.007, 0);
  const mesh = new THREE.Mesh(geom, mat);
  scene.addObject(lt, mesh);
  const getAccel = spatial.body.obj.property('accel', Vec3).getter(lt);
  const thrust = new THREE.Vector3();
  scene.subscribe(lt, () => {
    thrust.set(0, 0, 0);
    const accel = getAccel();
    if (accel) { accel.copyInto(thrust); }
    const magnitude = thrust.length();
    if (thrust.lengthSq() > 0.0005 && spatial.isReady()) {
      spatial.copyPositionInto(mesh.position);
      scaleMeshToView(scene, mesh, 0.001, null, null);
      mesh.scale.y *= -magnitude;
      pointObject3DInDirection(mesh, thrust);
      mesh.updateMatrix();
      mesh.updateMatrixWorld();
      mesh.visible = true;
    } else {
      mesh.visible = false;
    }
  });
}

export function newBodyVisual(scene: Scene, game: Game, obj: SsObject) {
  const lt = scene.lt.addDependent(obj.newDependent());
  const body = game.getBody(obj);
  const spatial = body.spatial(lt);
  let getSize = body.size.getter(lt);

  const [farMat, nearMat] = createColorMaterialPair(lt, body.color);
  const hudElement = new CSS2DObject(bodyHUD(lt, spatial));
  const mesh = new THREE.Mesh(emptyGeom, farMat);
  mesh.visible = false; // Shouldn't be needed because geom is empty, but see https://github.com/mrdoob/three.js/issues/26464
  scene.addObject(lt, mesh);
  object3DAddChild(lt, mesh, hudElement);
  ellipticalOrbit(lt, scene, spatial);

  let getAccel: (() => Vec3 | undefined) | null = null;
  const thrust = new THREE.Vector3();
  scene.subscribe(lt, () => {
    spatial.copyPositionInto(mesh.position);
    const displaySize = (getSize() || 0) * 0.75;
    scaleMeshToView(scene, mesh, displaySize, farMat, nearMat);
    if (getAccel) {
      thrust.set(0, 0, 0);
      const accel = getAccel();
      if (accel) { accel.copyInto(thrust); }
      if (thrust.lengthSq() < 0.0005) { spatial.copyVelocityInto(thrust); }
      pointObject3DInDirection(mesh, thrust)
    }
    mesh.updateMatrix();
    mesh.updateMatrixWorld();
  });

  obj.property('class', String).getThen(lt, cls => {
    if (cls === 'celestial') {
      body.size.getThen(lt, s => {
        createCelestialGeom(lt, mesh, s);
        mesh.visible = true;
      });
    } else if (cls === 'ship') {
      getAccel = spatial.body.obj.property('accel', Vec3).getter(lt);
      createThrustIndicator(lt, scene, spatial);
      body.size.getThen(lt, s => {
        createShipGeom(lt, mesh, s);
        mesh.visible = true;
      });
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
