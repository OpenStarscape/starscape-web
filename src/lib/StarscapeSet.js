import {StarscapeObject} from '../lib/Starscape.js';

/// Keeps track of a starscape property that is a set (a list of items that are guaranteed to be
/// unique and are in an arbitrary order). The callback is given two arguments whenever a new item
/// is added to the set: the lifetime for which the item is in the set and the item.
export default class StarscapeSet {
  constructor(property, lifetime, callback) {
    this.lt = lifetime.newChild()
    property.lifetime().addChild(this.lt);
    this.lt.add(this);
    this.items = new Map();
    this.callbacks = []; // lists containing [lifetime, callback]
    property.subscribe(this.lt, list => {
      if (!Array.isArray(list)) {
        console.error('StarscapeSet given value ' + list + ' which is not array');
        return;
      }
      const oldItems = this.items;
      this.items = new Map();
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const oldItemLifetime = oldItems.get(item);
        if (oldItemLifetime === undefined) {
          // If this item was not previously in the set
          if (this.items.has(item)) {
            console.error(
              'StarscapeSet has duplicate item ' +
              item +
              '. All items should be unique');
              continue;
          }
          const itemLifetime = this.lt.newChild();
          // if it's an object, should die with object (though the server should remove it for us)
          if (item instanceof StarscapeObject) {
            item.lifetime().addChild(itemLifetime);
          }
          this.items.set(item, itemLifetime);
          callback(itemLifetime, item);
        } else {
          oldItems.delete(item);
          this.items.set(item, oldItemLifetime);
        }
      }
      for (const [/*item*/, oldItemLifetime] of oldItems) {
        oldItemLifetime.dispose()
      }
    });
  }

  dispose() {
    this.items.clear();
    this.lt.dispose(); // probs not needed because this is what disposes of us but can't hurt
  }
}
