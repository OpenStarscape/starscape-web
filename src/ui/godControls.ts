import { Game } from '../game'
import { Lifetime } from '../core'

export function godControls(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('h-box');

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

