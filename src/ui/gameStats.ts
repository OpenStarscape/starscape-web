import { Game } from '../game'
import { Lifetime } from '../core'

function connCountMeter(lt: Lifetime, game: Game): HTMLElement {
  const conn_count = game.root.property('conn_count', Number);
  const max_conn_count = game.root.property('max_conn_count', Number);
  const elem = document.createElement('p');

  const update_conn_count = () => {
    const conns = conn_count.cachedValue();
    const max_conns = max_conn_count.cachedValue();
    if (conns !== undefined && max_conns !== undefined) {
      elem.style.display = 'inline'
      elem.textContent = 'Connections: ' + conns + '/' + max_conns;
    } else {
      elem.style.display = 'none'
    }
  }

  conn_count.subscribe(lt, _count => {
    update_conn_count();
  });
  max_conn_count.subscribe(lt, _count => {
    update_conn_count();
  });

  return elem;
}

function fpsMeter(lt: Lifetime, game: Game): HTMLElement {
  const elem = document.createElement('p');
  game.framerate.subscribe(lt, info => {
    elem.textContent = (
      'Average FPS: ' + info.average + ', ' +
      'Minimum FPS: ' + info.min
    );
  });
  return elem;
}

export function gameStats(lt: Lifetime, game: Game): HTMLElement {
  const div = document.createElement('div');
  div.style.color = 'white';

  div.appendChild(connCountMeter(lt, game));
  div.appendChild(fpsMeter(lt, game));

  return div;
}
