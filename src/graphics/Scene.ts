import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, messageFromError, Conduit, DependentLifetime, Subscriber } from '../core';
import { AnimationTimer } from '../game';

THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);
THREE.Object3D.DEFAULT_MATRIX_AUTO_UPDATE = false;
THREE.Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = false;

// using logarithmicDepthBuffer, so this is fine (numbers taken from three.js example)
const NEAR = 1e-6, FAR = 1e27;

/// Manages everything required to render a scene with THREE.js, subscribers are notified each frame
export class Scene extends Conduit<null> {
  readonly div = document.createElement('div');
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(75, 1, NEAR, FAR);
  readonly normalRenderer?: THREE.WebGLRenderer;
  readonly overlayRenderer: CSS2DRenderer;

  private autoRender: boolean;

  constructor(
    readonly lt: Lifetime,
    animation: AnimationTimer | null,
  ) {
    super();

    this.div.style.writingMode = 'horizontal-tb';
    this.div.style.width = '100%';
    this.div.style.height = '100%';

    try {
      this.normalRenderer = this.lt.own(new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true
      }));
      this.normalRenderer.setPixelRatio(window.devicePixelRatio);
      this.normalRenderer.domElement.style.width = '100%'
      this.normalRenderer.domElement.style.height = '100%'
      this.div.appendChild(this.normalRenderer.domElement);
    } catch (e) {
      const p = document.createElement('p');
      p.textContent = 'Failed to initialize WebGL: ' + messageFromError(e);
      this.div.appendChild(p);
    }

    this.overlayRenderer = new CSS2DRenderer();
    this.overlayRenderer.domElement.style.position = 'absolute';
    this.overlayRenderer.domElement.style.top = '0px';
    this.overlayRenderer.domElement.style.width = '100%'
    this.overlayRenderer.domElement.style.height = '100%'
    this.div.appendChild(this.overlayRenderer.domElement);

    this.scene.add(this.camera); // only required so children of the camera are visible

    const resizeObserver = new ResizeObserver(entries => {
      const box = entries[0].contentBoxSize[0];
      this.resize(box.inlineSize, box.blockSize);
    });
    resizeObserver.observe(this.div);

    lt.addCallback(() => {
      resizeObserver.unobserve(this.div);
      this.subscribers.clear(); // not needed, just to help the garbage collector
    });

    this.resize(this.div.clientWidth, this.div.clientHeight);
    this.autoRender = animation !== null;
    if (animation !== null) {
      animation.subscribe(this.lt, () => this.render());
    }
  }

  addObject(lt: Lifetime, obj3D: THREE.Object3D) {
    this.scene.add(obj3D);
    Lifetime.addCallbackToAll([lt, this.lt], () => {
      this.scene.remove(obj3D);
    })
  }

  protected override initialSubscriberAdded(_hasSubscribersLt: DependentLifetime): void {}
  protected override subscriberAdded(_subscriber: Subscriber<null>): void {}

  private resize(width: number, height: number) {
    if (this.normalRenderer) {
      this.normalRenderer.setSize(width, height);
    }
    this.overlayRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (!this.autoRender) {
      this.render();
    }
  }

  render() {
    this.sendToAllSubscribers(null);
    if (this.normalRenderer) {
      this.normalRenderer.render(this.scene, this.camera);
    }
    this.overlayRenderer.render(this.scene, this.camera);
  }
}
