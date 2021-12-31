import { Lifetime } from './Lifetime';

/// Manages a subscribed callback. Is added to both a lifetime and an element, and removes itself
/// from the other when either is destroyed.
export class Subscriber<T> {
  constructor(
    readonly element: Conduit<T>,
    readonly lifetime: Lifetime,
    public callback: ((value: T) => void) | null
  ) {
    this.lifetime.add(this);
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
    this.lifetime.delete(this);
    this.element.deleteSubscriber(this);
  }
}

/// A single piece of data or data (property) or message channel (action/event). May come from the
/// Starscape server or be local. All elements can be subscribed to, and specific types of elements
/// have additional methods (such as get).
export class Conduit<T> {
  protected subscribers = new Set<Subscriber<T>>();
  /// If this is a property-like conduit .value can be set to something other than undefined, in
  /// which case new subscribers will be sent it as they are added. Note that .value is NOT
  /// automatically updated (subclasses are expected to do that).
  protected value: T | undefined = undefined;
  /// Created each time we go from 0 to 1 subscribers, and removed and nulled out every time we
  /// go from 1 to 0.
  private hasSubscribersLt: Lifetime | null = null;

  /// The callback will be called with values as they become available. These values could be
  /// updates to a property or the values associated with actions, depending on the element type.
  /// The callback stops fireing as soon as the lifetime dies. It does NOT kill the lifetime
  /// when the property or it's owning object dies.
  subscribe(lt: Lifetime, callback: (value: T) => void) {
    this.addSubscriber(new Subscriber(this, lt, callback));
  }

  /// Adds a Subscriber, both to this class and to the subscriber's lifetime. Sends an initial
  /// update of .value if it's set.
  addSubscriber(subscriber: Subscriber<T>) {
    this.subscribers.add(subscriber);
    if (this.hasSubscribersLt === null) {
      this.hasSubscribersLt = new Lifetime();
      this.hasSubscribersLt.addCallback(() => {
        this.hasSubscribersLt = null;
        this.value = undefined;
        const subscribers = this.subscribers;
        this.subscribers = new Set();
        for (const subscriber of subscribers) {
          subscriber.dispose();
        }
      })
    }
    if (this.value !== undefined) {
      subscriber.sendValue(this.value);
    }
  }

  /// Deletes a subscriber from the internal list. Does NOT remove it from the lifetime.
  deleteSubscriber(subscriber: Subscriber<T>) {
    this.subscribers.delete(subscriber);
    if (this.subscribers.size === 0 && this.hasSubscribersLt !== null) {
      this.hasSubscribersLt.dispose();
    }
  }

  hasSubscribers(): boolean {
    return this.hasSubscribersLt !== null;
  }

  /// Unsubscribes all current subscriptions, does not need to be called
  dispose() {
    if (this.hasSubscribersLt !== null) {
      this.hasSubscribersLt.dispose();
    }
  }

  /// Sends updates to all subscribers.
  protected sendToAllSubscribers(value: T) {
    for (const subscriber of this.subscribers) {
      subscriber.sendValue(value);
    }
  }
}
