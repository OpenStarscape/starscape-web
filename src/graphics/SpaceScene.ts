import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, Vec3, messageFromError } from '../core';
import { Game, FramerateTracker } from '../game';
import { SsObject } from '../protocol';
import Starfield from '../graphics/Starfield';
import { BodyManager } from '../graphics/BodyManager';
import CameraManager from '../graphics/CameraManager';

/// Manages everything required to render a 3D space view with three.js.
class SpaceScene {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly overlayRenderer = new CSS2DRenderer();
  readonly domParent: HTMLDivElement;
  readonly starfield: Starfield;
  readonly bodies: BodyManager;
  readonly cameraManager: CameraManager;
  readonly fps = new FramerateTracker();

  // TODO: move this to Body
  private readonly thrustMesh: THREE.Mesh;

  constructor(
    readonly lt: Lifetime,
    readonly game: Game,
  ) {
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

    this.game.averageFps.addTracker(this.lt, this.fps);
    this.game.minFps.addTracker(this.lt, this.fps);

    try {
      this.renderer = new THREE.WebGLRenderer({antialias: true});
    } catch (e) {
      // TODO: some standard mechanism for alerts that looks good?
      window.alert('Failed to initialize WebGL: ' + messageFromError(e));
      throw (e);
    }
    // TODO: move this to Body
    const mat = this.lt.own(new THREE.MeshBasicMaterial({color: 0x20ff40, wireframe: true}));
    const geom = this.lt.own(new THREE.ConeGeometry(0.5, 3, 3));
    geom.translate(0, 4, 0);
    this.thrustMesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.thrustMesh);

    this.game.currentShip.subscribeWithValueLifetime(this.lt, (currentShipLt, obj) => {
      if (obj) {
        console.log('Switching to ship ', obj.id);
        obj.property('accel', Vec3).subscribe(currentShipLt, accel => {
          const vec = accel.newThreeVector3();
          vec.normalize();
          this.thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
          let len = accel.length();
          this.thrustMesh.scale.set(len, len, len);
        });
      }
    });

    this.domParent = document.createElement('div');
    this.domParent.style.width = '100%'
    this.domParent.style.height = '100%'

    this.renderer.setClearColor('black');
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.domParent.appendChild(this.renderer.domElement);

    this.overlayRenderer.setSize(window.innerWidth, window.innerHeight);
    this.overlayRenderer.domElement.style.position = 'absolute';
    this.overlayRenderer.domElement.style.top = '0px';
    this.overlayRenderer.domElement.style.width = '100%'
    this.overlayRenderer.domElement.style.height = '100%'
    this.domParent.appendChild(this.overlayRenderer.domElement);

    this.domParent.style.writingMode = 'horizontal-tb';

    new ResizeObserver(entries => {
      const box = entries[0].contentBoxSize[0];
      this.resize(box.inlineSize, box.blockSize);
    }).observe(this.domParent);

    this.starfield = new Starfield(this.lt, this.scene);
    this.bodies = new BodyManager(this.lt, this.game, this.scene);
    this.cameraManager = new CameraManager(
      this.lt,
      this.scene,
      this.overlayRenderer.domElement,
      this.bodies,
      this.game);
    this.cameraManager.setAspect(window.innerWidth / window.innerHeight);

    const shipCreatedLt = this.lt.newDependent();
    this.game.root.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
      this.game.currentShip.set(obj);
      shipCreatedLt.kill(); // only handle this callback once
    });

    this.game.root.action('create_ship', {arrayOf: Vec3}).fire([
      new Vec3(150, 0, 10),
      new Vec3(0, 30, 0),
    ]);

    this.resize(this.domParent.clientWidth, this.domParent.clientHeight);
    this.game.animation.subscribe(this.lt, () => this.render());
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.overlayRenderer.setSize(width, height);
    this.cameraManager.setAspect(width / height);
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
  }

  domElement() {
    return this.domParent;
  }
}

export function spaceScene(lt: Lifetime, game: Game): HTMLElement {
  const scene = new SpaceScene(lt, game);
  return scene.domElement();
}
