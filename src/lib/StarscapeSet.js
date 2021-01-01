import {StarscapeObject} from '../lib/Starscape.js';
import Lifetime from "../lib/Lifetime.js";

/// Keeps track of a starscape property that is a set (a list of items that are guaranteed to be
/// unique and are in an arbitrary order). The callback is given two arguments whenever a new item
/// is added to the set: the lifetime for which the item is in the set and the item.
export default class StarscapeSet {
  constructor(property, lifetime, callback) {
    this.lt = new Lifetime();
    lifetime.add(this.lt);
    property.lifetime().add(this.lt);
    this.lt.add(this);
    this.items = new Map();
    property.subscribe(this.lt, list => {
      if (!Array.isArray(list)) {
        throw 'ListProperty given value ' + list + ' which is not array';
      }
      const oldItems = this.items;
      this.items = new Map();
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const oldItemLifetime = oldItems.get(item);
        if (oldItemLifetime === undefined) {
          if (this.items.has(item)) {
            throw 'ListProperty has duplicate item ' + item + '. All items must be unique';
          }
          const itemLifetime = new Lifetime();
          this.lt.add(itemLifetime);
          // if it's an object, should die with object (though the server should remove it for us)
          if (item instanceof StarscapeObject) {
            item.lifetime().add(itemLifetime);
          }
          this.items.set(item, itemLifetime);
          callback(itemLifetime, item);
        } else {
          this.items.set(item, oldItemLifetime);
        }
        oldItems.delete(item);
      }
      for (const [/*item*/, oldItemLifetime] of oldItems) {
        this.lt.disposeOf(oldItemLifetime);
      }
    });
  }

  dispose() {
    this.items.clear();
    this.lt.dispose(); // probs not needed because this is what disposes of us but can't hurt
  }
}
