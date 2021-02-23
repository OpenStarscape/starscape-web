import {Vector3} from 'three';
import Lifetime from './Lifetime';

/// If two types and values are equal, using different methods depending on type.
export function valuesEqual(a: any, b: any) {
  if (a instanceof Vector3 && b instanceof Vector3) {
    return a.equals(b);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!valuesEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  } else {
    /// Starscape objects can be handled like everything else
    return a === b;
  }
}

/// Manages a subscribed callback. Is added to both a lifetime and an element, and removes itself
/// from the other when either is destroyed.
export class Subscriber {
  constructor(
    readonly element: Element,
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
export class Element {
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

  /// Should be called by subclasses, sends updates to all subscribers.
  sendUpdates(value: any) {
    for (const subscriber of this.subscribers) {
      subscriber.elementUpdate(value);
    }
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
}

/// An element that stores a mutable value locally. Not used for server properties.
export class ValueElement extends Element {
  constructor(value: any) {
    super();
    this.value = value;
  }

  /// Get the current value. NOTE: do NOT change the returned value. Call .set() instead so
  /// subscribers are notified of the change.
  get() {
    return this.value;
  }

  /// Set the value. Subscribers are only notified if the new value is different from the old one.
  set(value: any) {
    if (!valuesEqual(value, this.value)) {
      this.value = value;
      this.sendUpdates(value);
    }
  }
}

/// An element that represents a local data channel.
export class ActionElement extends Element {
  /// Subscribers will be notified for every action fired.
  fire(value: any) {
    this.sendUpdates(value);
  }
}
