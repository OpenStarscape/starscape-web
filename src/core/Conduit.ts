import { Lifetime } from './Lifetime';

/// Manages a subscribed callback. Is added to both a lifetime and an element, and removes itself
/// from the other when either is destroyed.
export class Subscriber<T> {
  constructor(
    readonly lifetime: Lifetime,
    protected callback: ((value: T) => void) | null,
    private readonly onDispose: (self: Subscriber<T>) => void,
  ) {
    this.lifetime.own(this);
  }

  /// Called by the element when it gets an update (this may be an updated property value or an
  /// action/event).
  sendValue(value: T) {
    if (this.callback !== null) {
      this.callback(value);
    }
  }

  /// Called by the lifetime when it dies or the element when it's object is destroyed.
  dispose() {
    this.callback = null;
    this.lifetime.disown(this);
    this.onDispose(this);
  }
}

/// A single piece of data or data (property) or message channel (action/event). May come from the
/// Starscape server or be local. All elements can be subscribed to, and specific types of elements
/// have additional methods (such as get).
export abstract class Conduit<T> {
  protected subscribers = new Set<Subscriber<T>>();
  /// Created each time we go from 0 to 1 subscribers, and removed and nulled out every time we
  /// go from 1 to 0.
  protected hasSubscribersLt: Lifetime | null = null;

  /// The subscriber count has gone from 0 to 1. When subscribers drops to 0 again
  /// hasSubscribersLt dies. If it later gains subscribers this may be called again.
  protected abstract initialSubscriberAdded(hasSubscribersLt: Lifetime): void;

  /// A new subscriber has been added and is in the subscribers list.
  protected abstract subscriberAdded(subscriber: Subscriber<T>): void;

  /// The callback will be called with values as they become available. These values could be
  /// updates to a property or the values associated with actions, depending on the element type.
  /// The callback stops fireing as soon as the lifetime dies. It does NOT kill the lifetime
  /// when the property or it's owning object dies.
  subscribe(lt: Lifetime, callback: (value: T) => void) {
    const subscriber = new Subscriber(lt, callback, (subscriber) => {
      this.subscribers.delete(subscriber);
      if (this.subscribers.size === 0 && this.hasSubscribersLt !== null) {
        this.hasSubscribersLt.dispose();
      }
    });
    if (this.hasSubscribersLt === null) {
      this.hasSubscribersLt = new Lifetime();
      this.hasSubscribersLt.addCallback(() => {
        this.hasSubscribersLt = null;
        const subscribers = this.subscribers;
        this.subscribers = new Set();
        for (const subscriber of subscribers) {
          subscriber.dispose();
        }
      });
      this.initialSubscriberAdded(this.hasSubscribersLt);
    }
    this.subscribers.add(subscriber);
    this.subscriberAdded(subscriber);
  }

  /// Similar to .subscribe, except each new value comes with a Lifetime and that lifetime
  /// dies before the next value is sent. You can use this value lifetime to make subscriptions
  /// that should be cancelled when the value changes.
  subscribeWithValueLifetime(lt: Lifetime, callback: (valueLt: Lifetime, value: T) => void) {
    let valueLt: Lifetime | null = null;
    this.subscribe(lt, (value) => {
      if (valueLt !== null) {
        valueLt.dispose();
      }
      valueLt = lt.newChild();
      callback(valueLt, value);
    });
  }

  hasSubscribers(): boolean {
    return this.hasSubscribersLt !== null;
  }

  /// Sends updates to all subscribers.
  protected sendToAllSubscribers(value: T) {
    for (const subscriber of this.subscribers) {
      subscriber.sendValue(value);
    }
  }
}
