import { SetConduit } from './SetConduit';
import { Conduit, Subscriber } from './Conduit';
import { Lifetime, DependentLifetime } from './Lifetime';

export class SetConduitImpl<T> extends Conduit<[Lifetime, T]> implements SetConduit<T> {
  protected items = new Map<T, DependentLifetime>();

  protected initialSubscriberAdded(_hasSubscribersLt: Lifetime): void {}

  protected subscriberAdded(subscriber: Subscriber<[Lifetime, T]>): void {
    for (const [item, itemLt] of this.items.entries()) {
      this.sendNewItem(itemLt, subscriber, item);
    }
  }

  protected add(value: T): void {
    if (!this.items.has(value)) {
      const itemLt = new DependentLifetime();
      this.items.set(value, itemLt);
      for (const subscriber of this.subscribers) {
        this.sendNewItem(itemLt, subscriber, value);
      }
    }
  }

  protected delete(value: T): void {
    const lt = this.items.get(value);
    if (lt !== undefined) {
      lt.kill();
    }
    this.items.delete(value);
  }

  protected clear(): void {
    for (const [_item, itemLt] of this.items.entries()) {
      itemLt.kill();
    }
    this.items.clear();
  }

  protected sendNewItem(itemLt: Lifetime, subscriber: Subscriber<[Lifetime, T]>, item: T) {
    const itemSubscriberLt = itemLt.newDependent();
    subscriber.lifetime.addDependent(itemSubscriberLt);
    subscriber.sendValue([itemSubscriberLt, item]);
  }

  has(value: T): boolean {
    return this.items.has(value);
  }

  keys(): IterableIterator<T> {
    return this.items.keys();
  }
}
