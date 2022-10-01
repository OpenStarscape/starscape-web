import { Lifetime, LocalProperty } from '../core';
import { Game, Nav, Body } from '../game';
//import { bodySelector } from './bodySelector';

/// The panel that allows the user to select which body to orbit and other navigation related options
export function navPanel(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  const targetProp = new LocalProperty<Body | null>(null);
  //const selector = bodySelector(lt, game, game.notCurrentShipBodies, targetProp);
  //div.appendChild(selector);
  const orbitButton = document.createElement('button')
  game.selectedBody.subscribeWithValueLifetime(lt, (valueLt, body) => {
    orbitButton.disabled = true;
    if (body) {
      body.name.subscribe(valueLt, name => {
        orbitButton.textContent = 'Orbit ' + (name ?? 'body');
        orbitButton.disabled = false;
      });
    } else {
      orbitButton.textContent = 'Orbit';
    }
  });
  orbitButton.addEventListener('click', () => {
    targetProp.set(game.selectedBody.get());
  });
  div.appendChild(orbitButton);
  targetProp.subscribe(lt, target => {
    let nav = { ...game.nav.get() };
    if (nav.scheme == Nav.Scheme.Orbit || nav.scheme == Nav.Scheme.Dock) {
      if (target) {
        nav.target = target;
        game.nav.set(nav);
      } else {
        game.nav.set({scheme: Nav.Scheme.None});
      }
    } else if (target) {
      game.nav.set({
        scheme: Nav.Scheme.Orbit,
        target: target,
        distance: null,
      });
    }
  })
  game.nav.subscribe(lt, state => {
    targetProp.set(Nav.targetOf(state));
    const ship = game.currentShip.get();
    if (ship) {
      Nav.applyState(ship, state);
    }
  })
  return div;
}
