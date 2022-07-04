import { Lifetime, LocalProperty, Conduit } from '../core';
import { SsObject } from '../protocol';
import { Game } from '../game';

function listItem(
  lt: Lifetime,
  obj: SsObject,
  isSelected: Conduit<boolean>,
  isClicked: () => void,
): HTMLElement {
  const elem = document.createElement('button');
  elem.style.display = 'block';
  elem.textContent = '---';

  obj.property('name', {nullable: String}).subscribe(lt, name => {
    if (name == null) {
      elem.textContent = '---';
    } else {
      elem.textContent = name;
    }
  })

  isSelected.subscribe(lt, isSelected => {
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
  includeFn: (obj: SsObject) => Conduit<boolean>
): [HTMLElement, Conduit<null | SsObject>] {
  const div = document.createElement('div');
  let isSelectedPropOfCurrentItem: null | LocalProperty<boolean> = null
  const currentSelected = new LocalProperty<null | SsObject>(null);

  game.bodies.subscribe(lt, ([itemLt, obj]) => {
    const selectedProp = new LocalProperty(false);
    const item = listItem(itemLt, obj, selectedProp, () => {
      isSelectedPropOfCurrentItem?.set(false);
      isSelectedPropOfCurrentItem = selectedProp;
      selectedProp.set(true);
      currentSelected.set(obj);
    });
    div.appendChild(item);
    // When body is destroyed, remove its button
    itemLt.addCallback(() => {
      div.removeChild(item);
      if (currentSelected.get() == obj) {
        currentSelected.set(null);
      }
    });
  });

  return [div, currentSelected];
}
