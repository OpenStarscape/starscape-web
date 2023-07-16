import * as THREE from 'three';
import { Lifetime, Vec3 } from '../core';
import { Game, Spatial } from '../game';
import { SsObject } from '../protocol';
import { Scene } from './Scene';
import { Starfield } from './Starfield';
import { CameraManager } from './CameraManager';
import { newBodyVisual } from './BodyVisual';

/// Manages everything required to render a 3D space view
class SpaceScene extends Scene {
  readonly starfield: Starfield;
  readonly cameraManager;

  // TODO: move this to Body
  private readonly thrustMesh: THREE.Mesh;

  constructor(
    readonly game: Game,
    lt: Lifetime,
    div: HTMLDivElement,
  ) {
    super(lt, div, game.animation);

    // TODO: move this to Body
    const mat = this.lt.own(new THREE.MeshBasicMaterial({color: 0x20ff40, wireframe: true}));
    const geom = this.lt.own(new THREE.ConeGeometry(0.5, 3, 3));
    geom.translate(0, 4, 0);
    this.thrustMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.thrustMesh);
    let currentShipSpatial: Spatial | null = null;
    game.currentShip.subscribeWithValueLifetime(lt, (valueLt, ship) => {
      currentShipSpatial = ship ? ship.spatial(valueLt) : null;
    });
    this.subscribe(lt, () => {
      if (currentShipSpatial !== null) {
        currentShipSpatial.copyPositionInto(this.thrustMesh.position);
      }
    });

    this.game.currentShip.subscribeWithValueLifetime(this.lt, (currentShipLt, ship) => {
      if (ship) {
        console.log('Switching to ship ', ship.obj.id);
        ship.obj.property('accel', Vec3).subscribe(currentShipLt, accel => {
          const vec = accel.newThreeVector3();
          vec.normalize();
          this.thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
          let len = accel.length();
          this.thrustMesh.scale.set(len, len, len);
        });
      }
    });

    this.normalRenderer.setClearColor('black');

    this.starfield = new Starfield(this.lt, this.scene);
    this.cameraManager = new CameraManager(
        this.lt,
        this,
        this.overlayRenderer.domElement,
        this.game,
        this.camera,
    );

    game.bodies.subscribe(this.lt, ([_temLt, body]) => {
      newBodyVisual(this, this.game, body);
    });
  }
}

export function spaceScene(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.style.writingMode = 'horizontal-tb';
  div.style.width = '100%';
  div.style.height = '100%';
  new SpaceScene(game, lt, div);
  return div;
}
