import { Lifetime, SetConduit, LocalProperty, FilterSetConduit, Conduit } from '../core';
import { SsObject } from '../protocol';

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
  bodySet: SetConduit<SsObject>,
): [HTMLElement, Conduit<null | SsObject>] {
  let isSelectedPropOfCurrentItem: null | LocalProperty<boolean> = null
  const currentSelected = new LocalProperty<null | SsObject>(null);

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
