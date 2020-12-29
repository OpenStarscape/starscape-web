export class Subscriber {
  constructor(element, group, callback) {
    this.element = element;
    this.group = group;
    this.callback = callback;
  }

  addToGroup() {
    this.group.addSubscriber(this);
  }

  elementUpdate(value) {
    if (this.callback !== null) {
      this.callback(value);
    }
  }

  elementDestroyed() {
    this.callback = null;
    this.group.deleteSubscriber(this);
  }

  groupFinalized() {
    this.callback = null;
    this.element.deleteSubscriber(this);
  }
}

export class Element {
  constructor() {
    this.subscribers = new Set();
    this.value = undefined;
    this.alive = true
  }

  subscribe(group, callback) {
    this.addSubscriber(new Subscriber(this, group, callback));
  }

  sendUpdates(value) {
    for (const subscriber of this.subscribers) {
      subscriber.elementUpdate(value);
    }
  }

  isAlive() {
    return this.alive;
  }

  notifyDestroyed() {
    this.alive = false;
    this.value = undefined;
    for (const subscriber of this.subscribers) {
      subscriber.elementDestroyed();
    }
    this.subscribers.clear()
  }

  addSubscriber(subscriber) {
    if (!this.isAlive()) {
      throw 'addSubscriber() called after object destroyed';
    }
    this.subscribers.add(subscriber);
    subscriber.addToGroup();
    if (this.value !== undefined) {
      subscriber.elementUpdate(this.value);
    }
  }

  deleteSubscriber(subscriber) {
    this.subscribers.delete(subscriber);
  }
}

export class ValueElement extends Element {
  constructor(value) {
    super();
    this.value = value;
  }

  get() {
    return this.value;
  }

  set(value) {
    this.value = value;
    this.sendUpdates(value);
  }
}

export class ActionElement extends Element {
  fire(value) {
    this.sendUpdates(value);
  }
}
