import { Lifetime } from '../core';
import { Game } from '../game';
import { Scene } from './Scene';
import { Starfield } from './Starfield';
import { CameraManager } from './CameraManager';
import { newBodyVisual } from './BodyVisual';

/// Manages everything required to render a 3D space view
class SpaceScene extends Scene {
  readonly starfield: Starfield;
  readonly cameraManager;

  constructor(
    readonly game: Game,
    lt: Lifetime,
    div: HTMLDivElement,
  ) {
    super(lt, div, game.animation);

    this.normalRenderer.setClearColor('black');

    this.starfield = new Starfield(this);
    this.starfield.setVisible(true);
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
