import { Conduit, Subscriber } from './Conduit';
import { Lifetime, DependentLifetime } from './Lifetime';
import { valuesEqual } from './valuesEqual'

export class MappingConduit<T> extends Conduit<T> {
  private value: T | undefined;

  constructor(
    private readonly setupFunc: (lt: Lifetime, setter: (value: T) => void) => void
  ) {
    super();
  }

  protected initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    this.setupFunc(hasSubscribersLt, (value: T) => {
      if (!valuesEqual(value, this.value)) {
        this.value = value;
        this.sendToAllSubscribers(value);
      }
    });
    hasSubscribersLt.addCallback(() => {
      this.value = undefined;
    });
  }

  protected subscriberAdded(subscriber: Subscriber<T>): void {
    if (this.value !== undefined) {
      subscriber.sendValue(this.value);
    }
  }
}
