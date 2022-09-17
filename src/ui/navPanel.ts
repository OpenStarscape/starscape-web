import { Lifetime, Vec3 } from '../core';
import { Game } from '../game';
import { SsObject } from '../protocol';
import { bodySelector } from './bodySelector';

function setOrbit(game: Game, targetObj: SsObject | null) {
  const ship = game.currentShip.get();
  const obj = ship?.obj;
  if (targetObj === ship) {
    targetObj = null;
  }
  if (obj && targetObj === null) {
    obj.property('ap_scheme', String).set('off');
    obj.property('accel', Vec3).set(new Vec3());
  } else if (obj && targetObj) {
    obj.property('ap_scheme', String).set('orbit');
    obj.property('ap_target', SsObject).set(targetObj);
    obj.property('ap_distance', {nullable: Number}).set(null);
  } else {
    console.error('Could not set up autopilot');
  }
}

/// The panel that allows the user to select which body to orbit and other navigation related options
export function navPanel(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  const selector = bodySelector(lt, game, game.notCurrentShipBodies);
  div.appendChild(selector);
  game.selectedBody.subscribe(lt, body => {
    setOrbit(game, body ? body.obj : null);
  })
  return div;
}
