import { Lifetime } from '../core';
import { Game } from '../game';
import SpaceScene from '../graphics/SpaceScene';
import { shipNameField, gameStats, orbitList } from '.';

export function overlay(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.appendChild(shipNameField(lt, game));
  div.appendChild(gameStats(lt, game));
  div.appendChild(orbitList(lt, game));
  return div;
}

export function gameContainer(lt: Lifetime, game: Game): HTMLElement {
  const stack = document.createElement('div');

  const scene = document.createElement('div');
  lt.add(new SpaceScene(game, scene));
  stack.appendChild(scene);

  stack.appendChild(overlay(lt, game));

  for (let i = 0; i < stack.children.length; i++) {
    (stack.children[i] as HTMLElement).style.zIndex = String((i + 1) * 10);
    (stack.children[i] as HTMLElement).style.position = 'absolute';
  }

  return stack;
}