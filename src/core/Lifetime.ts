export interface Disposable {
  dispose(): any;
}

class CallbackDisposable {
  private callback: (() => void) | null;

  constructor(callback: () => void) {
    this.callback = callback;
  }

  dispose() {
    if (this.callback) {
      this.callback();
    }
    this.callback = null;
  }
}

/// A group of objects which are all disposed of at once. Any object which has a .dispose() method
/// may be added to a lifetime. This includes three.js types which need to be disposed of, as well
/// as element subscribers (these are created automatically when elements are subscribed to).
export class Lifetime {
  private disposables = new Set<Disposable>();

  /// So it can be used as a mixin
  initLifetime() {
    if ('disposables' in (this as any)) {
      throw Error('initLifetime() called after disposables set');
    }
    this.disposables = new Set();
  }

  /// Create a new lifetime that will be disposed of with this one, but can also be disposed of
  /// sooner
  newChild() {
    const child = new Lifetime();
    this.addChild(child);
    return child;
  }

  /// Add another lifetime to be a child of this one. That means it is disposed when this is
  /// disposed, but it can be disposed sooner. A lifetime can be a child of multiple other
  /// lifetimes. When it's disposed it removes itself from this, so many can be created and disposed
  /// without gunking up the works.
  addChild(lifetime: Lifetime) {
    this.add(lifetime);
    lifetime.addCallback(() => {
      this.delete(lifetime);
    });
  }

  /// Add a callback to be called when disposed of.
  addCallback(callback: () => void) {
    this.add(new CallbackDisposable(callback));
  }

  /// Adds an object with a .dispose() method. .dispose() will be called when this lifetime is
  /// disposed of unless the object is deleted from it before then.
  add(disposable: Disposable) {
    this.disposables.add(disposable);
  }

  /// Delete a previously added object without disposing of it. Does nothing if the given object is
  /// not known.
  delete(disposable: Disposable) {
    this.disposables.delete(disposable);
  }

  /// Calls .dispose() on all added objects. This marks the lifetime as dead and it should not be
  /// used afterwards, except to dispose again (which does nothing but is allowed)
  dispose() {
    if (this.disposables.size !== 0) {
      const disposables = this.disposables;
      this.disposables = new Set();
      for (const disposable of disposables) {
        disposable.dispose();
      }
    }
  }
}
