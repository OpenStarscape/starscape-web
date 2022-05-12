import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3, LocalProperty } from '../core';
import { SsObject } from "../protocol";
import { ellipticalOrbit } from './ellipticalOrbit'
import { scalingMesh } from './scalingMesh'
import type { Spatial, Game } from '../game'
import type { Scene } from './Scene'

// NOTE: these would need to be disposed of/added to a lifetime if they were not global
const emptyGeom = new THREE.BufferGeometry();
const yVec = new THREE.Vector3(0, 1, 0);

class BodyVisual {
  private readonly labelDiv: HTMLDivElement;
  private readonly label: CSS2DObject;

  protected colorProp = new LocalProperty<string>('#ffffff');
  protected geomProp = new LocalProperty<[geom: THREE.BufferGeometry, size: number]>([emptyGeom, 1]);

  readonly obj: SsObject;

  constructor(
    protected readonly scene: Scene,
    protected readonly lt: Lifetime,
    readonly spatial: Spatial,
    updateQuat: (quat: THREE.Quaternion) => void,
  ) {
    this.obj = spatial.bodyObj();

    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'body-label';
    this.labelDiv.style.marginTop = '1em';
    this.label = new CSS2DObject(this.labelDiv);
    this.label.visible = false;
    this.obj.property('name', {nullable: String}).subscribe(this.lt, name => {
      if (name !== null) {
        this.labelDiv.textContent = name;
        this.label.visible = true;
      } else {
        this.label.visible = false;
      }
    });
    this.colorProp.subscribe(lt, color => {
      this.labelDiv.style.color = color;
    });

    ellipticalOrbit(lt, scene, spatial, this.colorProp);
    scalingMesh(lt, scene, spatial, this.colorProp, this.geomProp, updateQuat, [this.label]);
  }
}

class CelestialVisual extends BodyVisual {
  constructor(scene: Scene, lt: Lifetime, spatial: Spatial) {
    super(scene, lt, spatial, q => {});
    this.obj.property('color', String).subscribe(this.lt, color => {
      // Set color using a Starscape protocol color (starts with 0x...)
      color = '#' + color.slice(2);
      this.colorProp.set(color);
    });
    this.obj.property('size', Number).getThen(this.lt, km => {
      this.geomProp.set([lt.own(new THREE.SphereBufferGeometry(km, 16, 16)), km]);
    });
  }
}

class ShipVisual extends BodyVisual {
  private readonly direction = new THREE.Vector3();
  private accel: Vec3 | undefined;

  constructor(scene: Scene, lt: Lifetime, spatial: Spatial) {
    super(scene, lt, spatial, q => {
      if (this.accel !== undefined) {
        this.accel.copyInto(this.direction);
      }
      if (this.direction.lengthSq() < 0.0005 && this.spatial.isReady()) {
        this.spatial.copyVelocityInto(this.direction);
      }
      this.direction.normalize();
      q.setFromUnitVectors(yVec, this.direction);
    });
    this.colorProp.set('#ffffff');
    this.geomProp.set([lt.own(new THREE.ConeBufferGeometry(0.01, 0.03, 16)), 0.01]);
    this.obj.property('accel', Vec3).subscribe(this.lt, accel => {
      this.accel = accel;
    });
  }
}

export function newBodyVisual(scene: Scene, game: Game, obj: SsObject) {
  const lt = obj.newDependent();
  scene.lt.addDependent(lt);
  const spatial = game.spatials.spatialFor(lt, obj);
  obj.property('class', String).getThen(lt, cls => {
    if (cls === 'celestial') {
      new CelestialVisual(scene, lt, spatial);
    } else if (cls === 'ship') {
      new ShipVisual(scene, lt, spatial);
    } else {
      console.error('unknown body class ', cls);
    }
  });
}
