import { Conduit } from './Conduit'

/// An element that represents a local data channel.
export class LocalAction<T> extends Conduit<T> {
  /// Subscribers will be notified for every action fired.
  fire(value: T) {
    this.sendToAllSubscribers(value);
  }
}
