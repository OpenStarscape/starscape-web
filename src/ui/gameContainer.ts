import { Lifetime, Vec3 } from '../core';
import { SsObject } from '../protocol';
import { Game } from '../game';
import { spaceScene } from '../graphics';
import { shipNameField, gameStats, navPanel, weaponsPanel } from '.';

export function overlay(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.appendChild(shipNameField(lt, game));
  div.appendChild(gameStats(lt, game));
  div.appendChild(navPanel(lt, game));
  div.appendChild(weaponsPanel(lt, game));
  return div;
}

export function gameContainer(lt: Lifetime, game: Game): HTMLElement {
  const stack = document.createElement('div');
  stack.style.width = '100%'
  stack.style.height = '100%'

  stack.appendChild(spaceScene(lt, game));

  stack.appendChild(overlay(lt, game));

  for (let i = 0; i < stack.children.length; i++) {
    (stack.children[i] as HTMLElement).style.zIndex = String((i + 1) * 10);
    (stack.children[i] as HTMLElement).style.position = 'absolute';
  }

  const shipCreatedLt = lt.newDependent();
  game.root.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
    game.currentShip.set(game.getBody(obj));
    shipCreatedLt.kill(); // only handle this callback once
  });

  game.root.action('create_ship', [Vec3, Vec3]).fire([
    new Vec3(150, 0, 10),
    new Vec3(0, 30, 0),
  ]);

  return stack;
}
