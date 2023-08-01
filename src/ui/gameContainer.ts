import { Lifetime, Vec3 } from '../core';
import { SsObject } from '../protocol';
import { Game } from '../game';
import { SpaceScene } from '../graphics';
import { godControls, shipNameField, gameStats, navPanel, weaponsPanel } from '.';

export function overlay(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.appendChild(godControls(lt, game));
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

  const scene = new SpaceScene(lt, game);
  stack.appendChild(scene.div);

  stack.appendChild(overlay(lt, game));

  for (let i = 0; i < stack.children.length; i++) {
    (stack.children[i] as HTMLElement).style.zIndex = String((i + 1) * 10);
    (stack.children[i] as HTMLElement).style.position = 'absolute';
  }

  const shipCreatedLt = lt.newDependent();
  game.root.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
    const body = game.getBody(obj);
    game.currentShip.set(body);
    scene.cameraFocusBody.set(body);
    shipCreatedLt.kill(); // only handle this callback once
  });

  game.root.action('create_ship', undefined).fire({
    position: new Vec3(150, 0, 10),
    velocity: new Vec3(0, 30, 0),
    max_accel: 10.0,
  });

  return stack;
}
