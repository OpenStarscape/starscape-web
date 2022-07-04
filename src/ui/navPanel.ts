import { Lifetime, LocalProperty, Vec3 } from '../core';
import { Game } from '../game';
import { SsObject } from '../protocol';
import { bodySelector } from './bodySelector';

function setOrbit(game: Game, targetObj: SsObject | null) {
  const ship = game.currentShip.get();
  if (targetObj === ship) {
    targetObj = null;
  }
  if (ship && targetObj === null) {
    ship.property('ap_scheme', String).set('off');
    ship.property('accel', Vec3).set(new Vec3());
  } else if (ship && targetObj) {
    ship.property('ap_scheme', String).set('orbit');
    ship.property('ap_target', SsObject).set(targetObj);
    ship.property('ap_distance', {nullable: Number}).set(null);
  } else {
    console.error('Could not set up autopilot');
  }
}

/// The panel that allows the user to select which body to orbit and other navigation related options
export function navPanel(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  const [selector, selectedBody] = bodySelector(lt, game.notCurrentShipBodies);
  div.appendChild(selector);
  selectedBody.subscribe(lt, obj => {
    setOrbit(game, obj);
  })
  return div;
}
