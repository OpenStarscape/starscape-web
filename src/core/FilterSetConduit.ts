import { Conduit } from './Conduit';
import { SetConduit } from './SetConduit';
import { SetConduitImpl } from './SetConduitImpl';
import { Lifetime, DependentLifetime } from './Lifetime';

export class FilterSetConduit<T> extends SetConduitImpl<T> {
  constructor(
    readonly source: SetConduit<T>,
    readonly filter: (lt: Lifetime, item: T) => Conduit<boolean>
  ) {
    super();
  }

  protected initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.clear();
    })
    this.source.subscribe(hasSubscribersLt, ([lt, item]) => {
      this.filter(lt, item).subscribe(lt, include => {
        if (include) {
          this.add(item);
        } else {
          this.delete(item);
        }
      });
      lt.addCallback(() => {
        this.delete(item);
      });
    });
  }

  has(value: T): boolean {
    if (!this.hasSubscribers()) {
      throw new Error('FilterSetConduit.has() called when not subscribed to');
    }
    return super.has(value);
  }

  keys(): IterableIterator<T> {
    if (!this.hasSubscribers()) {
      throw new Error('FilterSetConduit.keys() called when not subscribed to');
    }
    return super.keys();
  }
}
