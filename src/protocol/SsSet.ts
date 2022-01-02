import { Lifetime, DependentLifetime, Conduit, Subscriber } from '../core';
import { SsObject } from './SsObject';
import { SsProperty } from './SsProperty';
import { SsValue } from './SsValue';

/// Keeps track of a starscape property that is a set (a list of items that are guaranteed to be
/// unique and are in an arbitrary order). A SsSet can have any number of subscribers. A subscriber
/// is called once for each item currently in the set when it's subscribed, and subsequently
/// whenever and item is added. Subscribers are given a tuple of two arguments: a lifetime that will
/// die when the item leaves the set, and the item.
export class SsSet<T extends SsValue> extends Conduit<[Lifetime, T]> {
  private items = new Map<T, DependentLifetime>();

  constructor(
    private readonly property: SsProperty<T[]>,
  ) {
    super();
  }

  private newItem(item: T) {
    if (this.hasSubscribersLt === null) {
      console.error('SsSet.newItem() called with null hasSubscribersLt');
      return;
    }
    const itemLt = this.hasSubscribersLt.newDependent();
    // if it's an object, should die with the object (though the server should remove it for us)
    if (item instanceof SsObject) {
      item.addDependent(itemLt);
    }
    this.items.set(item, itemLt);
    for (const subscriber of this.subscribers) {
      this.sendNewItem(itemLt, subscriber, item);
    }
  }

  private handleArray(items: T[]) {
    const oldItems = this.items;
    this.items = new Map();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const oldItemLifetime = oldItems.get(item);
      if (oldItemLifetime === undefined) {
        // If this item was not previously in the set
        if (this.items.has(item)) {
          console.error(
            'SsSet has duplicate item ' +
            item +
            '. All items should be unique');
            continue;
        }
        this.newItem(item);
      } else {
        oldItems.delete(item);
        this.items.set(item, oldItemLifetime);
      }
    }
    for (const oldItemLt of oldItems.values()) {
      oldItemLt.kill();
    }
  }

  initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.items.clear();
    });
    this.property.lifetime().addDependent(hasSubscribersLt);
    this.property.subscribe(hasSubscribersLt, items => {
      if (!Array.isArray(items)) {
        console.error('SsSet given value ' + items + ' which is not array');
        return;
      }
      this.handleArray(items);
    });
  }

  subscriberAdded(subscriber: Subscriber<[Lifetime, T]>): void {
    for (const [item, itemLt] of this.items.entries()) {
      this.sendNewItem(itemLt, subscriber, item);
    }
  }

  private sendNewItem(itemLt: Lifetime, subscriber: Subscriber<[Lifetime, T]>, item: T) {
    const itemSubscriberLt = itemLt.newDependent();
    subscriber.lifetime.addDependent(itemSubscriberLt);
    subscriber.sendValue([itemSubscriberLt, item]);
  }
}
