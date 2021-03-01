import * as THREE from "three";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Game, Lifetime } from "../core";
import { SsObject, SsSignal } from "../protocol";
import Starfield from '../graphics/Starfield';
import BodyManager from '../graphics/BodyManager';
import CameraManager from '../graphics/CameraManager';

/// Manages everything required to render a 3D space view with three.js.
export default class SpaceScene {
  readonly lt = new Lifetime();
  readonly scene = new THREE.Scene();
  readonly renderer = new THREE.WebGLRenderer({antialias: true});
  readonly overlayRenderer = new CSS2DRenderer();
  readonly starfield: Starfield;
  readonly bodies: BodyManager;
  readonly cameraManager: CameraManager;

  // TODO: move this to Body
  private readonly thrustMesh: THREE.Mesh;
  private thrustLt: Lifetime | null = null;

  constructor(
    readonly game: Game,
    readonly domParent: HTMLDivElement
  ) {
    // TODO: move this to Body
    const mat = new THREE.MeshBasicMaterial({color: 0x20ff40, wireframe: true});
    const geom = new THREE.ConeGeometry(0.5, 3, 3);
    geom.translate(0, 4, 0);
    this.thrustMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.thrustMesh);
    this.lt.add(mat);
    this.lt.add(geom);

    this.game.currentShip.subscribe(this.lt, obj => {
      if (this.thrustLt) {
        this.thrustLt.dispose();
        this.thrustLt = null;
      }
      if (obj) {
        console.log('Switching to ship ', obj.id);
        this.thrustLt = this.lt.newChild();
        obj.property('accel').subscribe(this.thrustLt, (accel: any) => {
          const vec = accel.clone();
          vec.normalize();
          this.thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
          let len = accel.length();
          this.thrustMesh.scale.set(len, len, len);
        });
      }
    });

    this.renderer.setClearColor('black');
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.domParent.appendChild(this.renderer.domElement);

    this.overlayRenderer.setSize(window.innerWidth, window.innerHeight);
    this.overlayRenderer.domElement.style.position = 'absolute';
    this.overlayRenderer.domElement.style.top = '0px';
    this.domParent.appendChild(this.overlayRenderer.domElement);

    this.starfield = new Starfield(this.lt, this.scene);
    this.bodies = new BodyManager(this.lt, this.scene, this.game.god);
    this.cameraManager = new CameraManager(
      this.lt,
      this.scene,
      this.overlayRenderer.domElement,
      this.bodies,
      this.game);
    this.cameraManager.setAspect(window.innerWidth / window.innerHeight);

    const shipCreatedLt = this.lt.newChild();
    const sig: SsSignal<SsObject> = this.game.god.signal('ship_created', SsObject);
    this.game.god.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
      this.game.currentShip.set(obj);
      shipCreatedLt.dispose(); // only handle this callback once
    });

    this.game.god.action('create_ship', [THREE.Vector3]).fire([
      new THREE.Vector3(150, 10, 0),
      new THREE.Vector3(0, 0, -30),
    ]);

    document.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.overlayRenderer.setSize(window.innerWidth, window.innerHeight);
      this.cameraManager.setAspect(window.innerWidth / window.innerHeight);
    });

    this.render();
  }

  render() {
    this.cameraManager.update();
    this.bodies.update(this.cameraManager.camera.position);

    let body = this.bodies.get(this.game.currentShip.get());
    if (body) {
      this.thrustMesh.position.copy(body.getPosition());
    }

    this.renderer.render(this.scene, this.cameraManager.camera);
    this.overlayRenderer.render(this.scene, this.cameraManager.camera);
    requestAnimationFrame(() => this.render());
  }
}
