import { Lifetime, LocalProperty } from '../core';
import { Spatial } from '../game';

/// The HTML element that hovers over a body in the 3D view
export function bodyHUD(lt: Lifetime, spatial: Spatial, colorProp: LocalProperty<string>): HTMLElement {
  const div = document.createElement('div');
  div.style.marginTop = '1em';
  const p = document.createElement('p');
  div.appendChild(p);
  p.className = 'body-label';
  p.style.display = 'none';
  const obj = spatial.bodyObj();
  obj.property('name', {nullable: String}).subscribe(lt, name => {
    if (name !== null) {
      p.style.display = 'block';
      p.textContent = name;
    } else {
      p.style.display = 'none';
    }
  });
  colorProp.subscribe(lt, color => {
    p.style.color = color;
  });
  return div;
}
