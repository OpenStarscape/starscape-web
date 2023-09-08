import { Lifetime, LocalProperty } from '../core';
import { Game, Body } from '../game';
import { Scene } from './Scene';
import { Starfield } from './Starfield';
import { CameraManager } from './CameraManager';
import { newBodyVisual } from './BodyVisual';

/// Manages everything required to render a 3D space view
export class SpaceScene extends Scene {
  readonly starfield: Starfield;
  readonly cameraManager;
  readonly cameraFocusBody = new LocalProperty<Body | null>(null);

  constructor(
    lt: Lifetime,
    readonly game: Game,
  ) {
    super(lt, game.animation);

    if (this.normalRenderer) {
      this.normalRenderer.setClearColor('black');
    }

    this.overlayRenderer.domElement.addEventListener('click', () => {
      game.selectedBody.set(null);
    });

    this.starfield = new Starfield(this);
    this.starfield.setVisible(true);
    this.cameraManager = new CameraManager(
        this.lt,
        this,
        this.overlayRenderer.domElement,
        this.camera,
    );

    this.cameraFocusBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
      this.cameraManager.targetSpatial = body ? body.spatial(valueLt) : null;
    });

    game.selectedBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
      this.cameraManager.focusSpatial = body ? body.spatial(valueLt) : null;
    });

    game.bodies.subscribe(lt, ([_temLt, body]) => {
      newBodyVisual(this, this.game, body);
    });

    game.currentShip.subscribe(lt, ship => {
      this.cameraFocusBody.set(ship);
    })
  }

  render() {
    if (!this.cameraManager) {
      // Sometimes this is called during initialization for some reason
      return;
    }
    this.cameraManager.update();
    super.render();
  }
}
