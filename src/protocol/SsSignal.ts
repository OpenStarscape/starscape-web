import { Subscriber, Conduit } from '../core';
import { SsObject } from './SsObject'

/// A signal sent to the client from the server. Created and returned by SsObject.signal().
export class SsSignal extends Conduit {
  private isSubscribed = false;

  constructor(
    private readonly obj: SsObject,
    private readonly name: string,
  ) {
    super();
  }

  /// Overrides parent method, generally not called externally.
  addSubscriber(subscriber: Subscriber) {
    super.addSubscriber(subscriber);
    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.obj.connection.subscribeTo(this.obj.id, this.name);
    }
  }

  /// Overrides parent method, generally not called externally.
  deleteSubscriber(subscriber: Subscriber) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size === 0 && this.isSubscribed) {
      this.isSubscribed = false;
      this.obj.connection.unsubscribeFrom(this.obj.id, this.name);
    }
  }

  /// Called by the event's object when the server sends an event.
  handleEvent(value: any) {
    this.sendUpdates(value);
  }

  /// Called by this property's object when the object is destroyed.
  dispose() {
    this.isSubscribed = false;
    super.dispose();
  }
}
