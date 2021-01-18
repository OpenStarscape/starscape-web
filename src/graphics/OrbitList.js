import StarscapeSet from "../lib/StarscapeSet.js";

class Button {
  constructor(list, lifetime, callback) {
    this.list = list;
    this.elem = document.createElement("BUTTON");
    this.elem.style.display = 'block'; // make vertical? for some reason?
    this.elem.onclick = () => {
      list.setSelected(this);
      callback();
      this.showSelected();
    };
    list.div.appendChild(this.elem);
    lifetime.add(this);
  }

  setText(text) {
    this.elem.textContent = text;
  }

  showSelected() {
    this.elem.style.fontWeight = 'bold';
  }

  showUnselected() {
    this.elem.style.fontWeight = null;
  }

  dispose() {
    // TODO: unselect?
    this.list.div.removeChild(this.elem);
  }
}

export default class OrbitList {
  constructor(lifetime, god, parentDiv, callback) {
    this.div = parentDiv;

    this.connCountLabel = document.createElement('p');
    this.connCountLabel.style.fontFamily = 'sans-serif';
    this.connCountLabel.style.color = 'white';
    this.div.appendChild(this.connCountLabel);
    const currentProp = god.property('conn_count');
    const maxProp = god.property('max_conn_count');
    this.getCurrentConns = currentProp.getter(lifetime);
    this.getMaxConns = maxProp.getter(lifetime);
    currentProp.subscribe(lifetime, (/*current*/) => {
      this.updateConnCount();
    });
    maxProp.subscribe(lifetime, (/*max*/) => {
      this.updateConnCount();
    });

    this.selectedButton = new Button(this, lifetime, 'Manual Control', () => callback(null));
    this.selectedButton.setText('Manual Control');
    this.selectedButton.showSelected();

    new StarscapeSet(god.property('bodies'), lifetime, (itemLt, obj) => {
      const button = new Button(this, itemLt, () => callback(obj));
      obj.property('name').subscribe(itemLt, name => {
        button.setText('Orbit ' + name);
      })
    });
  }

  updateConnCount() {
    this.connCountLabel.textContent =
      'Connections: ' +
      this.getCurrentConns() +
      '/' +
      this.getMaxConns();
  }

  setSelected(button) {
    if (this.selectedButton) {
      this.selectedButton.showUnselected();
    }
    this.selectedButton = button;
  }
}
