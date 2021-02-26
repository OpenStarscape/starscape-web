import { Conduit } from './Conduit';
import { valuesEqual } from './valuesEqual'

/// A local value that can be subscribed to and set
export class LocalProperty<T> extends Conduit<T> {
  constructor(value: T) {
    super();
    this.value = value;
  }

  /// Get the current value. NOTE: do NOT change the returned value. Call .set() instead so
  /// subscribers are notified of the change.
  get() {
    return this.value;
  }

  /// Set the value. Subscribers are only notified if the new value is different from the old one.
  set(value: T) {
    if (!valuesEqual(value, this.value)) {
      this.value = value;
      this.sendUpdates(value);
    }
  }
}
