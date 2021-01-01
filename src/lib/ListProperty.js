import {ActionElement} from '../lib/Element.js';
import Lifetime from "../lib/Lifetime.js";

export default class ListProperty {
  constructor(property, lifetime) {
    this.lt = new Lifetime();
    lifetime.add(this.lt);
    property.lifetime().add(this.lt);
    this.lt.add(this);
    this.items = new Map();
    this.itemAdded = new ActionElement();
    this.lt.add(this.itemAdded);
    property.subscribe(this.lt, list => {
      if (!Array.isArray(list)) {
        throw 'ListProperty given value ' + list + ' which is not array';
      }
      const oldItems = this.items;
      this.items = new Map();
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const value = oldItems.get(item);
        if (value === undefined) {
          if (this.items.has(item)) {
            throw 'ListProperty has duplicate item ' + item + '. All items must be unique';
          }
          this.items.set(item, null);
          this.itemAdded.fire(item);
        } else {
          this.items.set(item, value);
        }
        oldItems.delete(item);
      }
      for (const [/*key*/, val] of oldItems) {
        if (val) {
          this.lt.disposeOf(val);
        }
      }
    });
  }

  /// Sets the given key to the given value. Key must already be known. Value can either be an
  /// object with a .dispose() or null. If there is already a value, it is replaced and it is
  /// disposed. Replacing a value with itself is not allowed (because it would be disposed in the
  /// process and should not be used after that).
  set(key, val) {
    const old = this.items.get(key);
    this.items.set(key, val);
    if (val) {
      this.lt.add(val);
    }
    if (old) {
      this.lt.disposeOf(old);
    }
  }

  get(key) {
    return this.items.get(key);
  }

  dispose() {
    this.items.clear();
  }
}
