import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, messageFromError, Conduit, DependentLifetime, Subscriber } from '../core';
import { AnimationTimer } from '../game';

THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

/// Manages everything required to render a scene with THREE.js, subscribers are notified each frame
export class Scene extends Conduit<null> {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  readonly normalRenderer: THREE.WebGLRenderer;
  readonly overlayRenderer: CSS2DRenderer;

  private autoRender: boolean;

  constructor(
    readonly lt: Lifetime,
    div: HTMLDivElement,
    animation: AnimationTimer | null,
  ) {
    super();

    try {
      this.normalRenderer = this.lt.own(new THREE.WebGLRenderer({antialias: true}));
    } catch (e) {
      // TODO: some standard mechanism for alerts that looks good?
      window.alert('Failed to initialize WebGL: ' + messageFromError(e));
      throw (e);
    }

    this.normalRenderer.setPixelRatio(window.devicePixelRatio);
    this.normalRenderer.domElement.style.width = '100%'
    this.normalRenderer.domElement.style.height = '100%'
    div.appendChild(this.normalRenderer.domElement);

    this.overlayRenderer = new CSS2DRenderer();
    this.overlayRenderer.domElement.style.position = 'absolute';
    this.overlayRenderer.domElement.style.top = '0px';
    this.overlayRenderer.domElement.style.width = '100%'
    this.overlayRenderer.domElement.style.height = '100%'
    div.appendChild(this.overlayRenderer.domElement);

    this.scene.add(this.camera); // only required so children of the camera are visible

    const resizeObserver = new ResizeObserver(entries => {
      const box = entries[0].contentBoxSize[0];
      this.resize(box.inlineSize, box.blockSize);
    });
    resizeObserver.observe(div);

    lt.addCallback(() => {
      resizeObserver.unobserve(div);
      this.subscribers.clear(); // not needed, just to help the garbage collector
    });

    this.resize(div.clientWidth, div.clientHeight);
    this.autoRender = animation !== null;
    if (animation !== null) {
      animation.subscribe(this.lt, () => this.render());
    }
  }

  protected override initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {}
  protected override subscriberAdded(subscriber: Subscriber<null>): void {}

  private resize(width: number, height: number) {
    this.normalRenderer.setSize(width, height);
    this.overlayRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (!this.autoRender) {
      this.render();
    }
  }

  render() {
    this.sendToAllSubscribers(null);
    this.normalRenderer.render(this.scene, this.camera);
    this.overlayRenderer.render(this.scene, this.camera);
  }
}
