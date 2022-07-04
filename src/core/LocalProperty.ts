import { Conduit, Subscriber } from './Conduit';
import { Lifetime } from './Lifetime';
import { valuesEqual } from './valuesEqual'

/// A local value that can be subscribed to and set
export class LocalProperty<T> extends Conduit<T> {
  constructor(
    private value: T,
  ) {
    super();
  }

  protected initialSubscriberAdded(_hasSubscribersLt: Lifetime): void {}

  protected subscriberAdded(subscriber: Subscriber<T>): void {
    subscriber.sendValue(this.value);
  }

  /// Get the current value. NOTE: do NOT change the returned value. Call .set() instead so
  /// subscribers are notified of the change.
  get(): T {
    return this.value;
  }

  /// Set the value. Subscribers are only notified if the new value is different from the old one.
  set(value: T) {
    if (!valuesEqual(value, this.value)) {
      this.value = value;
      this.sendToAllSubscribers(value);
    }
  }
}
