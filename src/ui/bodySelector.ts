import { Lifetime, SetConduit, LocalProperty, FilterSetConduit } from '../core';
import { SsObject } from '../protocol';
import { Game, Body } from '../game';

function listItem(
  lt: Lifetime,
  body: Body,
  isClicked: () => void,
): HTMLElement {
  const elem = document.createElement('button');
  elem.style.display = 'block';
  elem.textContent = '---';

  body.name.subscribe(lt, name => {
    if (name == null) {
      elem.textContent = '---';
    } else {
      elem.textContent = name;
    }
  })

  body.isSelected.subscribe(lt, isSelected => {
    if (isSelected) {
      elem.style.fontWeight = 'bold';
      elem.style.color = 'blue';
    } else {
      elem.style.fontWeight = 'normal';
      elem.style.color = '';
    }
  })

  elem.addEventListener('click', () => {
    isClicked();
  });

  return elem;
}

export function bodySelector(
  lt: Lifetime,
  game: Game,
  bodySet: SetConduit<SsObject>,
): HTMLElement {
  const filterText = new LocalProperty<null | string>(null);
  const filterSet = new FilterSetConduit(bodySet, (bodyLt, body) => {
    const include = new LocalProperty(true);
    const nameProp = body.property('name', {nullable: String});
    const getName = nameProp.getter(bodyLt);
    const update = () => {
      const filter = filterText.get();
      const name = getName();
      include.set(filter === null || (name ? name.toLowerCase().includes(filter.toLowerCase()) : false));
    }
    nameProp.subscribe(bodyLt, _name => update());
    filterText.subscribe(bodyLt, _text => update());
    return include;
  })
  const div = document.createElement('div');
  const filterBox = div.appendChild(document.createElement('input'));
  filterBox.addEventListener('input', () => {
    filterText.set(filterBox.value ? filterBox.value : null);
  });
  filterSet.subscribe(lt, ([itemLt, obj]) => {
    const body = game.getBody(obj);
    const item = listItem(itemLt, body, () => {
      game.selectedBody.set(body);
    });
    div.appendChild(item);
    // When body is destroyed, remove its button
    itemLt.addCallback(() => {
      div.removeChild(item);
      if (game.selectedBody.get() === body) {
        game.selectedBody.set(null);
      }
    });
  });

  return div;
}
