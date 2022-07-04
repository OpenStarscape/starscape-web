import { Subscriber, valuesEqual, assertIsType, Lifetime, DependentLifetime } from '../core'
import { SsConduit } from './SsConduit'
import { SsRequestType } from './SsRequest'
import { SsValue } from './SsValue'

/// A named piece of data on an object. Created and returned by SsObject.property()
export class SsProperty<T extends SsValue> extends SsConduit<T> {
  private pendingGets: Set<Subscriber<T>> | null = null;
  private value: T | undefined = undefined;

  typeName(): string {
    return 'property';
  }

  lifetime(): Lifetime {
    return this.obj;
  }

  /// Sends a set request to the server. The new value is updated immediately.
  set(value: T) {
    if (!valuesEqual(value, this.value)) {
      this.obj.makeRequest({
        method: SsRequestType.Set,
        objId: this.obj.id,
        member: this.name,
        value: value,
      });
      this.handleUpdate(value);
    }
  }

  /// If the current value is not known (.cachedValue() == undefined) sends a get request, and
  /// invokes the given callback when it's completed. If the current value is known no request is
  /// made and the callback is called immediately. If the object or lifetime die before the request
  /// completes, the callback may never be called.
  getThen(lifetime: Lifetime, callback: (value: T) => void) {
    if (this.value === undefined) {
      const getSubscriber = new Subscriber(lifetime, callback, (getSubscriber) => {
        if (this.pendingGets !== null) {
          this.pendingGets.delete(getSubscriber);
        }
      });
      if (this.pendingGets === null) {
        this.pendingGets = new Set();
        this.obj.makeRequest({
          method: SsRequestType.Get,
          objId: this.obj.id,
          member: this.name,
        });
      }
      this.pendingGets.add(getSubscriber);
    } else {
      callback(this.value);
    }
  }

  /// Returns a callable which returns the current value. To make sure values are available, this
  /// subscribes to the property and stays subscribed as long as the given lifetime lives. Note that
  /// if there were no previous subscribers the returned getter will return undefined until the
  /// initial request completes.
  getter(lifetime: Lifetime) {
    this.subscribe(lifetime, (_) => {});
    return (): T | undefined => {
      return this.cachedValue();
    };
  }

  /// Returns the current cached value, or undefined if there is none. Will always return undefined
  /// when there are no subscribers. When the first subscriber is added returns undefined until
  /// the initial request completes. Using a getter function returned by .getter() is recommended
  /// over calling this directly since that ensures we are subscribed.
  cachedValue(): T | undefined {
    this.verifyObjAlive('cachedValue');
    return this.value;
  }

  protected initialSubscriberAdded(hasSubscribersLt: DependentLifetime): void {
    this.obj.addDependent(hasSubscribersLt);
    this.obj.makeRequest({
      method: SsRequestType.Subscribe,
      objId: this.obj.id,
      member: this.name,
    })
    hasSubscribersLt.addCallback(() => {
      this.value = undefined;
      this.obj.makeRequest({
        method: SsRequestType.Unsubscribe,
        objId: this.obj.id,
        member: this.name,
      })
    })
  }

  protected subscriberAdded(subscriber: Subscriber<T>): void {
    if (this.value !== undefined) {
      subscriber.sendValue(this.value);
    }
  }

  /// Called by this property's object when the value gets an update.
  handleUpdate(value: SsValue) {
    assertIsType<T>(value, this.rtType);
    if (this.hasSubscribersLt !== null) {
      this.value = value;
    }
    if (this.pendingGets !== null) {
      const pendingGets = this.pendingGets;
      this.pendingGets = null;
      for (const pendingGet of pendingGets) {
        pendingGet.sendValue(value);
        pendingGet.dispose();
      }
    }
    this.sendToAllSubscribers(value);
  }

  /// Called by this property's object when a get request is responded to.
  handleGetReply(value: SsValue) {
    this.handleUpdate(value);
  }
}
