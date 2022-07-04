import { Conduit } from './Conduit';
import { SetConduit } from './SetConduit';
import { SetConduitImpl } from './SetConduitImpl';
import { Lifetime, DependentLifetime } from './Lifetime';

export class FilterSetConduit<T> extends SetConduitImpl<T> {
  constructor(
    lt: Lifetime,
    source: SetConduit<T>,
    filter: (lt: Lifetime, item: T) => Conduit<boolean>
  ) {
    super();
    lt.addCallback(() => {
      this.clear();
    })
    source.subscribe(lt, ([lt, item]) => {
      filter(lt, item).subscribe(lt, include => {
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
