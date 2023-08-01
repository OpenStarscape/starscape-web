import { Game, spawnSolarSystem } from '../game'
import { Lifetime, Vec3 } from '../core'
import { SsObject } from '../protocol'

export function godControls(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('h-box');

  const resetBtn = document.createElement('button');
  div.appendChild(resetBtn);
  resetBtn.classList.add('action-button');
  resetBtn.textContent = 'Reset game';
  resetBtn.addEventListener('click', () => {
    // TODO: add confirm dialog
    game.root.action('reset', null).fire(null);
  });

  const spawnSystemBtn = document.createElement('button');
  div.appendChild(spawnSystemBtn);
  spawnSystemBtn.classList.add('action-button');
  spawnSystemBtn.textContent = 'Spawn solar system';
  spawnSystemBtn.addEventListener('click', () => {
    spawnSolarSystem(game);
  });

  const spawnShip = document.createElement('button');
  div.appendChild(spawnShip);
  spawnShip.classList.add('action-button');
  spawnShip.textContent = 'Spawn ship';
  spawnShip.style.display = 'none';
  spawnShip.addEventListener('click', () => {
    const shipCreatedLt = lt.newDependent();
    game.root.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
      const body = game.getBody(obj);
      game.currentShip.set(body);
      shipCreatedLt.kill(); // only handle this callback once
    });

    game.root.action('create_ship', undefined).fire({
      position: new Vec3(150, 0, 10),
      velocity: new Vec3(0, 30, 0),
      max_accel: 10.0,
    });
  });

  let bodyCount = 0;
  game.bodies.subscribe(lt, ([itemLt, _]) => {
    if (bodyCount === 0) {
      spawnSystemBtn.style.display = 'none';
      spawnShip.style.display = 'block';
    }
    bodyCount++;
    itemLt.addCallback(() => {
      bodyCount--;
      if (bodyCount === 0) {
        spawnSystemBtn.style.display = 'block';
        spawnShip.style.display = 'none';
      }
    });
  });

  let playing = false;
  const playPauseBtn = document.createElement('button');
  div.appendChild(playPauseBtn);
  playPauseBtn.classList.add('action-button');
  const tpt_prop = game.root.property('time_per_time', Number);
  playPauseBtn.addEventListener('click', () => {
    playing = !playing;
    tpt_prop.set(playing ? Number(gameSpeedInput.value) : 0);
  });
  const gameSpeedInput = document.createElement('input');
  div.appendChild(gameSpeedInput);
  gameSpeedInput.type = 'number';
  gameSpeedInput.addEventListener('input', () => {
    if (Number(gameSpeedInput.value) <= 0) {
      gameSpeedInput.value = '0.5';
    }
    if (playing) {
      tpt_prop.set(Number(gameSpeedInput.value));
    }
  });
  tpt_prop.subscribe(lt, tpt => {
    playing = tpt > 0;
    if (playing) {
      gameSpeedInput.value = tpt.toString();
      playPauseBtn.textContent = 'Pause';
    } else {
      playPauseBtn.textContent = 'Play';
    }
  });

  return div;
}

