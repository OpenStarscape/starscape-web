import { Subscriber, valuesEqual, assertIsType, Lifetime } from '../core'
import { SsConduit } from './SsConduit'
import { SsRequestType } from './SsRequest'
import { SsValue } from './SsValue'

/// A specialized subscriber used for receiving property get requests. Unlike a normal subscriber,
/// it's only supposed to be notified once and so removes itself from the element and lifetime.
class GetSubscriber<T> extends Subscriber<T> {
  elementUpdate(value: T) {
    super.elementUpdate(value);
    this.dispose();
  }

  isPending() {
    return this.callback !== null;
  }
}

/// A named piece of data on an object. Created and returned by SsObject.property()
export class SsProperty<T extends SsValue> extends SsConduit<T> {
  private isSubscribed = false;
  private hasPendingGet = false;

  typeName(): string {
    return 'property';
  }

  lifetime(): Lifetime {
    return this.obj;
  }

  /// Sends a set request to the server. The value is only updates and subscribers are only notified
  /// if and when the server responds to the request.
  set(value: T) {
    if (!valuesEqual(value, this.value)) {
      this.obj.makeRequest({
        method: SsRequestType.Set,
        objId: this.obj.id,
        member: this.name,
        value: value,
      })
      this.handleUpdate(value);
    }
  }

  /// If the current value is not known (.cachedValue() == undefined) sends a get request, and
  /// invokes the given callback when it's completed. If the current value is known no request is
  /// made and the callback is called immediately. If the object or lifetime die before the request
  /// completes, the callback may never be called.
  getThen(lifetime: Lifetime, callback: (value: T) => void) {
    const subscriber = new GetSubscriber(this, lifetime, callback);
    // Note that we call the super version, we don't want to call connection.subscribeTo()
    super.addSubscriber(subscriber);
    // May have already fired and cleaned itself up, in which case isPending() is false
    if (!this.hasPendingGet && subscriber.isPending()) {
      this.hasPendingGet = true;
      this.obj.makeRequest({
        method: SsRequestType.Get,
        objId: this.obj.id,
        member: this.name,
      })
    }
  }

  /// Returns a callable which returns the current value. To make sure values are available, this
  /// subscribes to the property and stays subscribed as long as the given lifetime lives. Note that
  /// if there were no previous subscribers the returned getter will return undefined until the
  /// initial request completes.
  getter(lifetime: Lifetime) {
    const subscriber = new Subscriber(this, lifetime, null);
    this.addSubscriber(subscriber);
    return (): T | undefined => {
      return this.cachedValue();
    };
  }

  /// Returns the current cached value, or undefined if there is none. Will always return undefined
  /// when there are no subscribers. WHen the first subscriber is added returns undefined until
  /// the initial request completes. Using a getter function returned by .getter() is recommended
  /// over calling this directly since that ensures we are subscribed.
  cachedValue(): T | undefined {
    if (!this.isAlive()) {
      throw new Error('cachedValue() called after object destroyed');
    }
    return this.value;
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
      this.value = undefined;
      this.obj.makeRequest({
        method: SsRequestType.Unsubscribe,
        objId: this.obj.id,
        member: this.name,
      })
    }
  }

  /// Called by this property's object when the value gets an update.
  handleUpdate(value: SsValue) {
    assertIsType<T>(value, this.rtType);
    if (this.isSubscribed) {
      this.value = value;
    }
    // get request subscribers need to be notified even when not subscribed
    this.sendUpdates(value);
  }

  /// Called by this property's object when a get request is responded to.
  handleGetReply(value: SsValue) {
    this.hasPendingGet = false;
    this.handleUpdate(value);
  }

  /// Called by this property's object when the object is destroyed.
  dispose() {
    this.isSubscribed = false;
    this.hasPendingGet = false;
    super.dispose();
  }
}
