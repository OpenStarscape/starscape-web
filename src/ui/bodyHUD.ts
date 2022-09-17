import { Lifetime } from '../core';
import { Spatial } from '../game';

/// The HTML element that hovers over a body in the 3D view
export function bodyHUD(lt: Lifetime, spatial: Spatial): HTMLElement {
  const body = spatial.body;
  const div = document.createElement('div');
  div.style.marginTop = '1em';
  const p = document.createElement('p');
  div.appendChild(p);
  p.className = 'body-label';
  p.style.display = 'none';
  body.name.subscribe(lt, name => {
    if (name !== null) {
      p.style.display = 'block';
      p.textContent = name;
    } else {
      p.style.display = 'none';
    }
  });
  body.color.subscribe(lt, color => {
    p.style.color = color;
  });
  body.isSelected.subscribe(lt, selected => {
    if (selected) {
      p.style.backgroundColor = 'white';
    } else {
      p.style.backgroundColor = 'black';
    }
  });
  div.addEventListener('click', () => {
    body.game.selectedBody.set(body);
  });
  return div;
}
