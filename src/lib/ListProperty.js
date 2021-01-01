import {ActionElement} from '../lib/Element.js';

export default class ListProperty {
  constructor(property, lifetime) {
    this.items = new Map();
    this.itemAdded = new ActionElement();
    this.itemDeleted = new ActionElement();
    lifetime.add(this.itemAdded);
    lifetime.add(this.itemDeleted);
    lifetime.add(this);
    property.subscribe(lifetime, list => {
      if (!Array.isArray(list)) {
        throw 'ListProperty given value ' + list + ' which is not array';
      }
      const oldItems = this.items;
      this.items = new Map();
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const value = oldItems.get(item);
        if (value === undefined) {
          this.items.set(item, null);
          this.itemAdded.fire(item);
        } else {
          this.items.set(item, value);
        }
        oldItems.delete(item);
      }
      for (const pair of oldItems) {
        this.itemDeleted.fire(pair);
      }
    });
  }

  set(key, val) {
    this.items.set(key, val);
  }

  get(key) {
    return this.items.get(key);
  }

  // TODO: handle destruction of the property

  dispose() {
    for (const pair of this.items) {
      this.itemDeleted.fire(pair);
    }
    this.items.clear();
  }
}
