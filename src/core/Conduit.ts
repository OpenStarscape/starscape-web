import { Lifetime } from './Lifetime';

/// Manages a subscribed callback. Is added to both a lifetime and an element, and removes itself
/// from the other when either is destroyed.
export class Subscriber {
  constructor(
    readonly element: Conduit,
    readonly lifetime: Lifetime,
    public callback: ((value: any) => void) | null
  ) {}

  /// Called by the element when it gets an update (this may be an updated property value or an
  /// action/event).
  elementUpdate(value: any) {
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
export class Conduit {
  protected subscribers = new Set<Subscriber>();
  /// If this is a property-like conduit .value can be set to something other than undefined, in
  /// which case new subscribers will be sent it as they are added. Note that .value is NOT
  /// automatically updated (subclasses are expected to do that).
  protected value: any = undefined;
  private alive = true;

  /// The callback will be called with values as they become available. These values could be
  /// updates to a property or the values associated with actions, depending on the element type.
  /// The callback stops fireing as soon as the lifetime dies.
  subscribe(lt: Lifetime, callback: (value: any) => void) {
    this.addSubscriber(new Subscriber(this, lt, callback));
  }

  /// Returns true if this element hasn't been destroyed.
  isAlive() {
    return this.alive;
  }

  /// Adds a Subscriber, both to this class and to the subscriber's lifetime. Sends an initial
  /// update of .value if it's set.
  addSubscriber(subscriber: Subscriber) {
    if (!this.isAlive()) {
      throw new Error('addSubscriber() called after object destroyed');
    }
    this.subscribers.add(subscriber);
    subscriber.lifetime.add(subscriber);
    if (this.value !== undefined) {
      subscriber.elementUpdate(this.value);
    }
  }

  /// Deletes a subscriber from the internal list. Does NOT remove it from the lifetime.
  deleteSubscriber(subscriber: Subscriber) {
    this.subscribers.delete(subscriber);
  }

  dispose() {
    this.alive = false;
    this.value = undefined;
    const subscribers = this.subscribers;
    this.subscribers = new Set();
    for (const subscriber of subscribers) {
      subscriber.dispose();
    }
  }

  /// Sends updates to all subscribers.
  protected sendUpdates(value: any) {
    for (const subscriber of this.subscribers) {
      subscriber.elementUpdate(value);
    }
  }
}
