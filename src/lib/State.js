class OneshotSubscriber {
  constructor(view, callback) {
    this.view = view;
    this.callback = callback;
    this.hasRan = false;
  }

  cancel() {
    this.callback = null;
  }

  notifyUpdate(value) {
    if (this.hasRan) {
      throw 'oneshot notified multiple times';
    }
    delete this.view.pendingOneshots[this];
    this.hasRan = true;
    if (this.callback !== null) {
      this.callback(value);
      this.callback = null;
    }
  }

  notifyDestroyed() {
    delete this.view.pendingOneshots[this];
  }
}

class CallbackSubscriber {
  constructor(view, callback) {
    this.view = view;
    this.callback = callback;
  }

  notifyUpdate(value) {
    this.callback(value);
  }

  notifyDestroyed() {
    delete this.view.subscribers[this];
  }
}

class PlaceholderSubscriber {
  constructor(view) {
    this.view = view;
  }

  notifyUpdate() {}

  notifyDestroyed() {
    delete this.view.subscribers[this];
  }
}

export default class State {
  constructor() {
    this.pendingOneshots = [];
    this.subscribers = new Map();
    this.isEnabled = true;
  }

  verifyEnabled() {
    if (!this.isEnabled) {
      throw 'State is disabled';
    }
  }

  getProperty(element, callback) {
    this.verifyEnabled();
    const oneshot = new OneshotSubscriber(this, callback);
    this.pendingOneshots.push(oneshot);
    element.addOneshot(oneshot);
  }

  propertyGetter(element) {
    this.verifyEnabled();
    const subscriber = new PlaceholderSubscriber(this);
    this.subscribers.set(subscriber, element);
    element.addSubscriber(subscriber);
    return () => {
      this.verifyEnabled();
      return element.cachedValue();
    };
  }

  subscribeProperty(element, callback) {
    this.verifyEnabled();
    const subscriber = new CallbackSubscriber(this, callback);
    this.subscribers.set(subscriber, element);
    element.addSubscriber(subscriber);
  }

  setProperty(element, value) {
    this.verifyEnabled();
    element.setProperty(value);
  }

  propertySetter(element) {
    this.verifyEnabled();
    return value => element.setProperty(value);
  }

  subscribeEvent(element, callback) {
    this.verifyEnabled();
    const subscriber = new CallbackSubscriber(this, callback);
    this.subscribers.set(subscriber, element);
    element.addSubscriber(subscriber);
  }

  fireAction(element, value) {
    this.verifyEnabled();
    element.fireAction(value);
  }

  actionFirer(element) {
    this.verifyEnabled();
    return value => element.fireAction(value);
  }

  disable() {
    if (!this.isEnabled) {
      return;
    }
    this.isEnabled = false;
    for (const oneshot of this.pendingOneshots) {
      oneshot.cancel();
    }
    this.pendingOneshots = [];
    for (const [subscriber, element] of this.subscribers) {
      element.removeSubscriber(subscriber);
    }
  }

  enable() {
    if (this.isEnabled) {
      return;
    }
    this.isEnabled = true;
    for (const [subscriber, element] of this.subscribers) {
      if (element.isAlive()) {
        element.addSubscriber(subscriber);
      } else {
        this.subscribers.delete(subscriber);
      }
    }
  }
}
