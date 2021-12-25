import { Lifetime, Vec3 } from '../core';
import { Game } from '../game';
import { SsObject, SsSet } from '../protocol';

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

function orbitButton(
  lt: Lifetime,
  game: Game,
  obj: SsObject,
  becomeSelected: (unselect: () => void) => void
): HTMLElement {
  const elem = document.createElement('button');
  elem.style.display = 'none';

  obj.property('name', {nullable: String}).subscribe(lt, name => {
    if (name == null) {
      elem.style.display = 'none';
    } else {
      elem.textContent = 'Orbit ' + name;
      elem.style.display = 'block';
    }
  })

  elem.addEventListener('click', () => {
    setOrbit(game, obj);
    becomeSelected(() => {
      elem.style.fontWeight = 'normal';
      elem.style.color = '';
    })
    elem.style.fontWeight = 'bold';
    elem.style.color = 'blue';
  });

  return elem;
}

export function orbitList(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  let unselectSelected = () => {};

  const becomeSelected = (unselect: () => void) => {
    unselectSelected();
    unselectSelected = unselect;
  };

  const bodyListProp = game.god.property('bodies', {arrayOf: SsObject});
  new SsSet(bodyListProp, lt, (itemLt, obj) => {
    const button = orbitButton(itemLt, game, obj, becomeSelected);
    div.appendChild(button);
    // When body is destroyed, remove its button
    itemLt.addCallback(() => {
      div.removeChild(button);
    });
  });

  return div;
}
