import { Lifetime, LocalProperty } from '../core';
import { Game, Nav, Body } from '../game';
import { bodySelector } from './bodySelector';

/// The panel that allows the user to select which body to orbit and other navigation related options
export function navPanel(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  const targetProp = new LocalProperty<Body | null>(null);
  const selector = bodySelector(lt, game, game.notCurrentShipBodies, targetProp);
  div.appendChild(selector);
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
    targetProp.set((state as any).target ?? null);
    const ship = game.currentShip.get();
    if (ship) {
      Nav.applyState(ship, state);
    }
  })
  return div;
}
