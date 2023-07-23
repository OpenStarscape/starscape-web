import { Lifetime } from '../core';
import { Game } from '../game';
import { Scene } from './Scene';
import { Starfield } from './Starfield';
import { CameraManager } from './CameraManager';
import { newBodyVisual } from './BodyVisual';

/// Manages everything required to render a 3D space view
export class SpaceScene extends Scene {
  readonly starfield: Starfield;
  readonly cameraManager;

  constructor(
    lt: Lifetime,
    readonly game: Game,
  ) {
    super(lt, game.animation);

    if (this.normalRenderer) {
      this.normalRenderer.setClearColor('black');
    }

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
