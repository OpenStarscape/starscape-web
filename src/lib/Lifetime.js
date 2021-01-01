/// A group of objects which are all disposed of at once. Any object which has a .dispose() method
/// may be added to a lifetime. This includes three.js types which need to be disposed of, as well
/// as element subscribers (these are created automatically when elements are subscribed to).
export default class Lifetime {
  constructor() {
    this.disposables = new Set();
    this.dead = false;
  }

  /// Returns true if the lifetime has not been disposed.
  isAlive() {
    return !this.dead;
  }

  /// Throws if this lifetime has been disposed.
  verifyAlive() {
    if (this.dead) {
      throw 'relevant Lifetime is dead';
    }
  }

  /// Adds an object with a .dispose() method. .dispose() will be called when this lifetime is
  /// disposed of unless the object is deleted from it before then.
  add(disposable) {
    this.verifyAlive()
    this.disposables.add(disposable);
  }

  /// Delete a previously added object without disposing of it. Does nothing if the given object is
  /// not known.
  delete(disposable) {
    this.disposables.delete(disposable);
  }

  /// Like .delete(), except calls .dispose() on the object (even if it was not known).
  disposeOf(disposable) {
    this.disposables.delete(disposable);
    disposable.dispose();
  }

  /// Calls .dispose() on all added objects. This marks the lifetime as dead and it should not be
  /// used afterwards, except to dispose again (which does nothing but is allowed)
  dispose() {
    if (this.dead) {
      return;
    }
    this.dead = true;
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
