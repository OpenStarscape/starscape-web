import { Lifetime } from '../core';
import { Game } from '../game';
import { spaceScene } from '../graphics';
import { shipNameField, gameStats, navPanel } from '.';

export function overlay(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.appendChild(shipNameField(lt, game));
  div.appendChild(gameStats(lt, game));
  div.appendChild(navPanel(lt, game));
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

  return stack;
}
