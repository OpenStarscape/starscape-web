import { Lifetime, Conduit, Subscriber } from '../core';
import { SsObject } from './SsObject';
import { SsProperty } from './SsProperty';
import { SsValue } from './SsValue';

/// Keeps track of a starscape property that is a set (a list of items that are guaranteed to be
/// unique and are in an arbitrary order). A SsSet can have any number of subscribers. A subscriber
/// is called once for each item currently in the set when it's subscribed, and subsequently
/// whenever and item is added. Subscribers are given a tuple of two arguments: a lifetime that will
/// die when the item leaves the set, and the item.
export class SsSet<T extends SsValue> extends Conduit<[Lifetime, T]> {
  private subscribedLt: Lifetime | null = null;
  private items = new Map<T, Lifetime>();

  constructor(
    private readonly property: SsProperty<T[]>,
  ) {
    super();
  }

  private newItem(item: T) {
    if (this.subscribedLt === null) {
      console.error('SsSet.newItem() called with null subscribedLt, should not be possible');
      return;
    }
    const itemLt = this.subscribedLt.newChild();
    // if it's an object, should die with object (though the server should remove it for us)
    if (item instanceof SsObject) {
      item.addChild(itemLt);
    }
    this.items.set(item, itemLt);
    for (const subscriber of this.subscribers) {
      this.sendNewItem(itemLt, subscriber, item);
    }
  }

  private setup() {
    this.subscribedLt = this.property.lifetime().newChild();
    this.property.subscribe(this.subscribedLt, list => {
      if (!Array.isArray(list)) {
        console.error('SsSet given value ' + list + ' which is not array');
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
        oldItemLt.dispose();
      }
    });
  }

  addSubscriber(subscriber: Subscriber<[Lifetime, T]>) {
    super.addSubscriber(subscriber);
    for (const [item, itemLt] of this.items.entries()) {
      this.sendNewItem(itemLt, subscriber, item);
    }
    if (this.subscribedLt === null) {
      this.setup();
    }
  }

  deleteSubscriber(subscriber: Subscriber<[Lifetime, T]>) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size === 0 && this.subscribedLt !== null) {
      this.subscribedLt.dispose();
      this.subscribedLt = null;
      this.items.clear();
    }
  }

  private sendNewItem(itemLt: Lifetime, subscriber: Subscriber<[Lifetime, T]>, item: T) {
    const itemSubscriberLt = itemLt.newChild();
    subscriber.lifetime.addChild(itemSubscriberLt);
    subscriber.sendValue([itemSubscriberLt, item]);
  }
}
