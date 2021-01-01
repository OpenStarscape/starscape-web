/// Manages a subscribed callback. Is added to both a lifetime and an element, and removes itself
/// from the other when either is destroyed.
export class Subscriber {
  constructor(element, lifetime, callback) {
    this.element = element;
    this.lifetime = lifetime;
    this.callback = callback;
  }

  /// Called by the element when it gets an update (this may be an updated property value or an
  /// action/event).
  elementUpdate(value) {
    if (this.callback !== null) {
      this.callback(value);
    }
  }

  /// Called by the element when it is destroyed.
  elementDestroyed() {
    this.callback(undefined);
    this.callback = null;
    this.lifetime.delete(this);
  }

  /// Called by the lifetime when it dies.
  dispose() {
    this.callback = null;
    this.element.deleteSubscriber(this);
  }
}

/// A single piece of data or data (property) or message channel (action/event). May come from the
/// Starscape server or be local. All elements can be subscribed to, and specific types of elements
/// have additional methods (such as get).
export class Element {
  constructor() {
    this.subscribers = new Set();
    /// If this is a property-like conduit .value can be set to something other than undefined, in
    /// which case new subscribers will be sent it as they are added. Note that .value is NOT
    /// automatically updated (subclasses are expected to do that).
    this.value = undefined;
    this.alive = true;
  }

  /// The callback will be called with values as they become available. These values could be
  /// updates to a property or the values associated with actions, depending on the element type.
  /// The callback stops fireing as soon as the lifetime dies.
  subscribe(lifetime, callback) {
    this.addSubscriber(new Subscriber(this, lifetime, callback));
  }

  /// Returns true if this element hasn't been destroyed.
  isAlive() {
    return this.alive;
  }

  // --- Below methods should only be called called by subclasses ---

  /// Should be called by subclasses, sends updates to all subscribers.
  sendUpdates(value) {
    for (const subscriber of this.subscribers) {
      subscriber.elementUpdate(value);
    }
  }

  /// Called by the subclass when it's destroyed. Notifies all subscribers.
  notifyDestroyed() {
    this.alive = false;
    this.value = undefined;
    for (const subscriber of this.subscribers) {
      subscriber.elementDestroyed();
    }
    this.subscribers.clear()
  }

  /// Adds a Subscriber, both to this class and to the subscriber's lifetime. Sends an initial
  /// update of .value if it's set.
  addSubscriber(subscriber) {
    if (!this.isAlive()) {
      throw 'addSubscriber() called after object destroyed';
    }
    this.subscribers.add(subscriber);
    subscriber.lifetime.add(subscriber);
    if (this.value !== undefined) {
      subscriber.elementUpdate(this.value);
    }
  }

  /// Deletes a subscriber from the internal list. Does NOT remove it from the lifetime.
  deleteSubscriber(subscriber) {
    this.subscribers.delete(subscriber);
  }

  /// Make compatible with lifetimes.
  dispose() {
    this.notifyDestroyed();
  }
}

/// An element that stores a mutable value locally. Not used for server properties.
export class ValueElement extends Element {
  constructor(value) {
    super();
    this.value = value;
  }

  /// Get the current value. NOTE: do NOT change the returned value. Call .set() instead so
  /// subscribers are notified of the change.
  get() {
    return this.value;
  }

  /// Set the value. Subscribers are only notified if the new value is different from the old one.
  set(value) {
    if (this.value !== value) {
      this.value = value;
      this.sendUpdates(value);
    }
  }
}

/// An element that represents a local data channel.
export class ActionElement extends Element {
  /// Subscribers will be notified for every action fired.
  fire(value) {
    this.sendUpdates(value);
  }
}
