import { Conduit } from './Conduit';
import { SetConduit } from './SetConduit';
import { SetConduitImpl } from './SetConduitImpl';
import { Lifetime, DependentLifetime } from './Lifetime';

export class FilterSetConduit<T> extends SetConduitImpl<T> {
  constructor(
    readonly source: SetConduit<T>,
    readonly filter: (item: T, lt: Lifetime) => Conduit<boolean>
  ) {
    super();
  }

  protected initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.clear();
    })
    this.source.subscribe(hasSubscribersLt, ([lt, item]) => {
      this.filter(item, lt).subscribe(lt, include => {
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
}
