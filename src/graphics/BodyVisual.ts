import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3, LocalProperty } from '../core';
import { SsObject } from "../protocol";
import { ellipticalOrbit } from './ellipticalOrbit'
import type { Spatial, Game } from '../game'
import type { Scene } from './Scene'

// NOTE: these would need to be disposed of/added to a lifetime if they were not global
const emptyGeom = new THREE.BufferGeometry();
const yVec = new THREE.Vector3(0, 1, 0);

class BodyVisual {
  private readonly labelDiv: HTMLDivElement;
  private readonly label: CSS2DObject;

  private readonly solidMat;
  private readonly wireMat;

  protected size = 1;
  protected colorProp = new LocalProperty<string>('#ffffff');
  protected readonly mesh;

  readonly obj: SsObject;

  constructor(
    protected readonly scene: Scene,
    protected readonly lt: Lifetime,
    readonly spatial: Spatial,
  ) {
    this.obj = spatial.bodyObj();
    scene.subscribe(this.lt, () => this.update());

    ellipticalOrbit(lt, scene, spatial, this.colorProp);

    this.solidMat = this.lt.own(new THREE.MeshBasicMaterial({color: 'white'}));
    this.wireMat = this.lt.own(new THREE.MeshBasicMaterial({color: 'white', wireframe: true}));

    this.mesh = new THREE.Mesh(emptyGeom, this.wireMat);
    this.mesh.matrixAutoUpdate = true;

    this.scene.scene.add(this.mesh);
    this.lt.addCallback(() => {
      this.scene.scene.remove(this.mesh);
    });

    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'body-label';
    this.labelDiv.style.marginTop = '1em';
    this.label = new CSS2DObject(this.labelDiv);
    this.label.visible = false;
    this.mesh.add(this.label);

    this.obj.property('name', {nullable: String}).subscribe(this.lt, name => {
      if (name !== null) {
        this.labelDiv.textContent = name;
        this.label.visible = true;
      } else {
        this.label.visible = false;
      }
    });

    this.colorProp.subscribe(lt, color => {
      this.wireMat.color.setStyle(color);
      this.solidMat.color.setStyle(color);
      this.labelDiv.style.color = color;
    });
  }

  protected update() {
    this.spatial.copyPositionInto(this.mesh.position);
    const dist = this.mesh.position.distanceTo(this.scene.camera.position);
    const scale = dist / 100 / this.size;
    if (scale > 1) {
      this.mesh.scale.setScalar(scale);
      this.mesh.material = this.solidMat;
    } else {
      this.mesh.scale.setScalar(1);
      this.mesh.material = this.wireMat;
    }
  }
}

class CelestialVisual extends BodyVisual {
  constructor(scene: Scene, lt: Lifetime, spatial: Spatial) {
    super(scene, lt, spatial);
    this.obj.property('color', String).subscribe(this.lt, color => {
      // Set color using a Starscape protocol color (starts with 0x...)
      color = '#' + color.slice(2);
      this.colorProp.set(color);
    });
    this.obj.property('size', Number).getThen(this.lt, km => {
      this.size = km;
      this.mesh.geometry = this.lt.own(new THREE.SphereBufferGeometry(this.size, 16, 16));
    });
  }
}

class ShipVisual extends BodyVisual {
  private readonly direction = new THREE.Vector3();
  private accel: Vec3 | undefined;

  constructor(scene: Scene, lt: Lifetime, spatial: Spatial) {
    super(scene, lt, spatial);
    this.colorProp.set('#ffffff');
    this.size = 0.01;
    this.mesh.geometry = this.lt.own(new THREE.ConeBufferGeometry(0.01, 0.03, 16));
    this.obj.property('accel', Vec3).subscribe(this.lt, accel => {
      this.accel = accel;
    });
  }

  protected update() {
    super.update();
    if (this.accel !== undefined) {
      this.accel.copyInto(this.direction);
    }
    if (this.direction.lengthSq() < 0.0005 && this.spatial.isReady()) {
      this.spatial.copyVelocityInto(this.direction);
    }
    this.direction.normalize();
    this.mesh.quaternion.setFromUnitVectors(yVec, this.direction);
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
