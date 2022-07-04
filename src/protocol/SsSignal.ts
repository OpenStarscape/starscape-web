import { DependentLifetime, Subscriber, assertIsType } from '../core';
import { SsConduit } from './SsConduit'
import { SsRequestType } from './SsRequest'
import { SsValue } from './SsValue'

/// A signal sent to the client from the server. Created and returned by SsObject.signal().
export class SsSignal<T extends SsValue> extends SsConduit<T> {
  typeName(): string {
    return 'signal';
  }

  protected initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    this.obj.addDependent(hasSubscribersLt);
    this.obj.makeRequest({
      method: SsRequestType.Subscribe,
      objId: this.obj.id,
      member: this.name,
    });
    hasSubscribersLt.addCallback(() => {
      this.obj.makeRequest({
        method: SsRequestType.Unsubscribe,
        objId: this.obj.id,
        member: this.name,
      });
    })
  }

  protected subscriberAdded(_subscriber: Subscriber<T>): void {}

  /// Called by the event's object when the server sends an event.
  handleSignal(value: SsValue) {
    assertIsType<T>(value, this.rtType);
    this.sendToAllSubscribers(value);
  }
}
