import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, DependentLifetime, Vec3, Conduit, TAU } from '../core';
import { SsObject } from "../protocol";
import { bodyHUD } from "../ui";
import { ellipticalOrbit } from './ellipticalOrbit'
import type { Game } from '../game'
import type { Scene } from './Scene'
import { SpaceScene } from './SpaceScene';

const yVec = new THREE.Vector3(0, 1, 0);
const tmpVecA = new THREE.Vector3();
const tmpQuatA = new THREE.Quaternion();
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
  tmpVecA.copy(yVec);
  tmpVecA.applyQuaternion(object.quaternion);
  tmpQuatA.setFromUnitVectors(tmpVecA, direction);
  object.quaternion.premultiply(tmpQuatA);
}

export function newBodyVisual(scene: SpaceScene, game: Game, obj: SsObject) {
  const lt = scene.lt.addDependent(obj.newDependent());
  let visibleLt: DependentLifetime | null = null;
  const body = game.getBody(obj);
  const spatial = body.spatial(lt);
  let displaySize = 0.001;

  const [farMat, nearMat] = createColorMaterialPair(lt, body.color);
  const hudElement = new CSS2DObject(bodyHUD(lt, spatial));
  hudElement.visible = false;
  const mesh = new THREE.Mesh(emptyGeom, farMat);
  mesh.visible = false; // Shouldn't be needed because geom is empty, but see https://github.com/mrdoob/three.js/issues/26464
  scene.addObject(lt, mesh);
  object3DAddChild(lt, mesh, hudElement);

  let getAccel: (() => Vec3 | undefined) | null = null;
  let thrusterMesh: THREE.Mesh | null = null;
  const thrust = new THREE.Vector3();
  scene.subscribe(lt, () => {
    spatial.copyPositionInto(mesh.position);
    const distToCam = mesh.position.distanceTo(scene.cameraManager.camera.position);
    const parent = spatial.parent();
    let distToParent = Infinity;
    if (parent) {
      parent.copyPositionInto(tmpVecA);
      distToParent = mesh.position.distanceTo(tmpVecA);
    }
    if (!spatial.isReady() ||  distToParent * 40 < distToCam) {
      if (visibleLt) {
        visibleLt.kill();
        visibleLt = null;
      }
      return;
    }
    if (!visibleLt) {
      visibleLt = lt.newDependent();
      mesh.visible = true;
      hudElement.visible = true;
      ellipticalOrbit(visibleLt, scene, spatial);
      visibleLt.addCallback(() => {
        mesh.visible = false;
        hudElement.visible = false;
        if (thrusterMesh) {
          thrusterMesh.visible = false;
        }
      });
    }
    scaleMeshToView(scene, mesh, displaySize * 0.75, farMat, nearMat);
    if (getAccel && thrusterMesh) {
      thrust.set(0, 0, 0);
      const accel = getAccel();
      if (accel) { accel.copyInto(thrust); }
      if (thrust.lengthSq() < 0.0005) {
        spatial.copyVelocityInto(thrust);
        thrusterMesh!.visible = false;
        if (parent) {
          parent.copyVelocityInto(tmpVecA);
          thrust.sub(tmpVecA);
        }
      } else {
        thrusterMesh!.visible = true;
        const thrustSize = thrust.length();
        thrusterMesh!.scale.y = -thrustSize;
        thrusterMesh!.position.y = -displaySize;
        thrusterMesh!.updateMatrix();
      }
      pointObject3DInDirection(mesh, thrust)
    }
    mesh.updateMatrix();
    mesh.updateMatrixWorld();
  });

  obj.property('class', String).getThen(lt, cls => {
    if (cls === 'celestial') {
      body.size.getThen(lt, s => {
        displaySize = Math.max(s, displaySize);
        const celestialGeom = lt.own(new THREE.SphereGeometry(displaySize, 16, 16));
        celestialGeom.rotateX(TAU / 4);
        mesh.geometry = celestialGeom;
      });
    } else if (cls === 'ship') {
      getAccel = spatial.body.obj.property('accel', Vec3).getter(lt);
      body.size.getThen(lt, s => {
        displaySize = Math.max(s, displaySize);
        const shipGeom = lt.own(new THREE.ConeGeometry(1 * displaySize, 3 * displaySize, 16));
        shipGeom.translate(0, 0.5 * displaySize, 0);
        mesh.geometry = shipGeom;
        const thrusterMat = lt.own(new THREE.MeshBasicMaterial({color: 0xFFA000}));
        const thrusterGeom = lt.own(new THREE.ConeGeometry(displaySize * 0.5, displaySize, 5));
        thrusterGeom.translate(0, 0.5 * displaySize, 0);
        thrusterMesh = new THREE.Mesh(thrusterGeom, thrusterMat);
        thrusterMesh.visible = false;
        mesh.add(thrusterMesh);
      });
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
