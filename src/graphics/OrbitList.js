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

  setSelected(button) {
    if (this.selectedButton) {
      this.selectedButton.showUnselected();
    }
    this.selectedButton = button;
  }
}
