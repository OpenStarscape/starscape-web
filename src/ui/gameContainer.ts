import { Lifetime, Vec3 } from '../core';
import { Game } from '../game';
import { SpaceScene } from '../graphics';
import { godControls, shipNameField, gameStats, navPanel, weaponsPanel } from '.';

export function overlay(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.alignItems = 'flex-start';
  div.style.pointerEvents = 'none';
  div.appendChild(godControls(lt, game));
  div.appendChild(shipNameField(lt, game));
  div.appendChild(gameStats(lt, game));
  div.appendChild(navPanel(lt, game));
  div.appendChild(weaponsPanel(lt, game));
  for (let i = 0; i < div.children.length; i++) {
    (div.children[i] as HTMLElement).style.pointerEvents = 'auto';
  }
  return div;
}

export function gameContainer(lt: Lifetime, game: Game): HTMLElement {
  const stack = document.createElement('div');
  stack.style.width = '100%'
  stack.style.height = '100%'

  const scene = new SpaceScene(lt, game);
  stack.appendChild(scene.div);

  stack.appendChild(overlay(lt, game));

  for (let i = 0; i < stack.children.length; i++) {
    (stack.children[i] as HTMLElement).style.zIndex = String((i + 1) * 10);
    (stack.children[i] as HTMLElement).style.position = 'absolute';
  }

  return stack;
}
