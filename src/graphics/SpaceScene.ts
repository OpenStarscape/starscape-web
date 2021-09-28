import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3 } from '../core';
import { Game, FramerateTracker } from '../game';
import { SsObject } from '../protocol';
import Starfield from '../graphics/Starfield';
import { BodyManager } from '../graphics/BodyManager';
import CameraManager from '../graphics/CameraManager';

/// Manages everything required to render a 3D space view with three.js.
export default class SpaceScene extends Lifetime {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly overlayRenderer = new CSS2DRenderer();
  readonly starfield: Starfield;
  readonly bodies: BodyManager;
  readonly cameraManager: CameraManager;
  readonly fps = new FramerateTracker();

  // TODO: move this to Body
  private readonly thrustMesh: THREE.Mesh;
  private thrustLt: Lifetime | null = null;

  constructor(
    readonly game: Game,
    readonly domParent: HTMLDivElement
  ) {
    super();

    Vec3.threeScale = 1;
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

    this.game.fps.addTracker(this, this.fps);

    try {
      this.renderer = new THREE.WebGLRenderer({antialias: true});
    } catch (e) {
      // TODO: some standard mechanism for alerts that looks good?
      window.alert('Failed to initialize WebGL: ' + e.message);
      throw (e);
    }
    // TODO: move this to Body
    const mat = new THREE.MeshBasicMaterial({color: 0x20ff40, wireframe: true});
    const geom = new THREE.ConeGeometry(0.5, 3, 3);
    geom.translate(0, 4, 0);
    this.thrustMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.thrustMesh);
    this.add(mat);
    this.add(geom);

    this.game.currentShip.subscribe(this, obj => {
      if (this.thrustLt) {
        this.thrustLt.dispose();
        this.thrustLt = null;
      }
      if (obj) {
        console.log('Switching to ship ', obj.id);
        this.thrustLt = this.newChild();
        obj.property('accel', Vec3).subscribe(this.thrustLt, accel => {
          const vec = accel.newThreeVector3();
          vec.normalize();
          this.thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
          let len = accel.length() * Vec3.threeScale;
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

    this.starfield = new Starfield(this, this.scene);
    this.bodies = new BodyManager(this, this.game, this.scene);
    this.cameraManager = new CameraManager(
      this,
      this.scene,
      this.overlayRenderer.domElement,
      this.bodies,
      this.game);
    this.cameraManager.setAspect(window.innerWidth / window.innerHeight);

    const shipCreatedLt = this.newChild();
    this.game.god.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
      this.game.currentShip.set(obj);
      shipCreatedLt.dispose(); // only handle this callback once
    });

    this.game.god.action('create_ship', {arrayOf: Vec3}).fire([
      new Vec3(150, 0, 10),
      new Vec3(0, 30, 0),
    ]);

    document.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.overlayRenderer.setSize(window.innerWidth, window.innerHeight);
      this.cameraManager.setAspect(window.innerWidth / window.innerHeight);
    });

    this.render();
  }

  render() {
    this.fps.recordFrame();
    this.cameraManager.update();
    this.bodies.update(this.cameraManager.camera.position);

    const body = this.bodies.get(this.game.currentShip.get());
    if (body !== undefined) {
      body.copyPositionInto(this.thrustMesh.position);
    }

    this.renderer.render(this.scene, this.cameraManager.camera);
    this.overlayRenderer.render(this.scene, this.cameraManager.camera);
    requestAnimationFrame(() => this.render());
  }
}
