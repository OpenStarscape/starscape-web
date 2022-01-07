import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Lifetime, messageFromError } from '../core';
import { AnimationTimer } from '../game';

THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

interface Updateable {
  update(): void;
}

/// Manages everything required to render a scene with THREE.js
export abstract class Scene extends THREE.Scene {
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

  protected readonly normalRenderer: THREE.WebGLRenderer;
  protected readonly overlayRenderer: CSS2DRenderer;
  protected updateables: Set<Updateable> | null = new Set();
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

    this.add(this.camera); // only required so children of the camera are visible

    const resizeObserver = new ResizeObserver(entries => {
      const box = entries[0].contentBoxSize[0];
      this.resize(box.inlineSize, box.blockSize);
    });
    resizeObserver.observe(div);

    lt.addCallback(() => {
      resizeObserver.unobserve(div);
      this.updateables = null;
    });

    this.resize(div.clientWidth, div.clientHeight);
    this.autoRender = animation !== null;
    if (animation !== null) {
      animation.subscribe(this.lt, () => this.render());
    }
  }

  addUpdateable(lt: Lifetime, updateable: Updateable) {
    this.updateables!.add(updateable);
    lt.addCallback(() => {
      if (this.updateables !== null) {
        this.updateables.delete(updateable);
      }
    });
  }

  private resize(width: number, height: number) {
    this.normalRenderer.setSize(width, height);
    this.overlayRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (!this.autoRender) {
      this.render();
    }
  }

  protected render() {
    for (const updateable of this.updateables!) {
      updateable.update();
    }
    this.normalRenderer.render(this, this.camera);
    this.overlayRenderer.render(this, this.camera);
  }
}
