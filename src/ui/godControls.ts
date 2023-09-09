import { Game, spawnSolarSystem } from '../game'
import { Lifetime, Vec3 } from '../core'
import { SsObject } from '../protocol'
import { create } from '.'

export function godControls(lt: Lifetime, game: Game): HTMLElement {
  const resetGameBtn = create.button('Reset game', {click: () => {
    // TODO: add confirm dialog
    game.root.action('reset', null).fire(null);
  }});
  const spawnSystemBtn = create.button('Spawn solar system', {click: () => {
    spawnSolarSystem(game);
  }});
  const spawnShipBtn = create.button('Spawn ship', {click: () => {
    const shipCreatedLt = lt.newDependent();
    game.root.signal('ship_created', SsObject).subscribe(shipCreatedLt, obj => {
      const body = game.getBody(obj);
      game.currentShip.set(body);
      shipCreatedLt.kill(); // only handle this callback once
    });
    game.root.action('create_ship', undefined).fire({
      position: new Vec3(1500, 0, 10),
      velocity: new Vec3(0, 30, 0),
      max_accel: 10.0,
    });
  }})

  let bodyCount = 0;
  game.bodies.subscribe(lt, ([itemLt, _]) => {
    if (bodyCount === 0) {
      spawnSystemBtn.disabled = true;
      spawnShipBtn.disabled = false;
    }
    bodyCount++;
    itemLt.addCallback(() => {
      bodyCount--;
      if (bodyCount === 0) {
        spawnSystemBtn.disabled = false;
        spawnShipBtn.disabled = true;
      }
    });
  });

  let playing = false;
  const tpt_prop = game.root.property('time_per_time', Number);
  const playPauseBtn = create.button('', {click: () => {
    playing = !playing;
    if (Number(gameSpeedInput.value) <= 0) {
      gameSpeedInput.value = '1';
    }
    tpt_prop.set(playing ? Number(gameSpeedInput.value) : 0);
  }});
  const gameSpeedInput = create.input('number', {value: '1', input: () => {
    if (Number(gameSpeedInput.value) <= 0) {
      gameSpeedInput.value = '0.1';
    }
    if (playing) {
      tpt_prop.set(Number(gameSpeedInput.value));
    }
  }});
  tpt_prop.subscribe(lt, tpt => {
    playing = tpt > 0;
    if (playing) {
      gameSpeedInput.value = tpt.toString();
      playPauseBtn.textContent = 'Pause';
    } else {
      playPauseBtn.textContent = 'Play';
    }
  });

  return create.vBox([
    resetGameBtn,
    spawnSystemBtn,
    spawnShipBtn,
    playPauseBtn,
    gameSpeedInput,
  ]);
}

