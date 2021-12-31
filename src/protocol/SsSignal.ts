import { Subscriber, assertIsType } from '../core';
import { SsConduit } from './SsConduit'
import { SsRequestType } from './SsRequest'
import { SsValue } from './SsValue'

/// A signal sent to the client from the server. Created and returned by SsObject.signal().
export class SsSignal<T extends SsValue> extends SsConduit<T> {
  private isSubscribed = false;

  typeName(): string {
    return 'signal';
  }

  /// Overrides parent method, generally not called externally.
  addSubscriber(subscriber: Subscriber<T>) {
    super.addSubscriber(subscriber);
    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.obj.makeRequest({
        method: SsRequestType.Subscribe,
        objId: this.obj.id,
        member: this.name,
      })
    }
  }

  /// Overrides parent method, generally not called externally.
  deleteSubscriber(subscriber: Subscriber<T>) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size === 0 && this.isSubscribed) {
      this.isSubscribed = false;
      this.obj.makeRequest({
        method: SsRequestType.Unsubscribe,
        objId: this.obj.id,
        member: this.name,
      })
    }
  }

  /// Called by the event's object when the server sends an event.
  handleSignal(value: SsValue) {
    assertIsType<T>(value, this.rtType);
    this.sendToAllSubscribers(value);
  }

  /// Called by this property's object when the object is destroyed.
  dispose() {
    this.isSubscribed = false;
    super.dispose();
  }
}
