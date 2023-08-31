import { Lifetime } from '../core';
import { Spatial, Nav } from '../game';

/// The HTML element that hovers over a body in the 3D view
export function bodyHUD(lt: Lifetime, spatial: Spatial): HTMLElement {
  const body = spatial.body;
  const div = document.createElement('div');
  const selectionIndicator = document.createElement('div');
  selectionIndicator.className = 'body-selection-indicator';
  div.appendChild(selectionIndicator);
  div.className = 'body-div';
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
    selectionIndicator.style.borderColor = color;
  });
  body.isSelected.subscribe(lt, selected => {
    div.classList.toggle('selected', selected);
  });
  div.addEventListener('click', evt => {
    body.game.selectedBody.set(body);
    evt.stopPropagation();
  });
  return div;
}
