import { Conduit, Subscriber } from './Conduit'
import { Lifetime } from './Lifetime'

/// An element that represents a local data channel.
export class LocalAction<T> extends Conduit<T> {
  initialSubscriberAdded(_hasSubscribersLt: Lifetime): void {}
  subscriberAdded(_subscriber: Subscriber<T>): void {}

  /// Subscribers will be notified for every action fired.
  fire(value: T) {
    this.sendToAllSubscribers(value);
  }
}
