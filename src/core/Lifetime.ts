export interface Disposable {
  dispose(): any;
}

class CallbackDisposable {
  private callback: (() => void) | null;

  constructor(callback: () => void) {
    this.callback = callback;
  }

  dispose() {
    if (this.callback !== null) {
      this.callback();
    }
    this.callback = null;
  }
}

/// A group of objects which are all disposed of at once. Any object which has a .dispose() method
/// may be added to a lifetime. This includes three.js types which need to be disposed of, as well
/// as subscribers (these are created automatically when conduits are subscribed to).
export class Lifetime {
  private disposables: Set<Disposable> | null = new Set();

  /// So it can be used as a mixin
  initLifetime() {
    if ('disposables' in (this as any)) {
      throw Error('initLifetime() called after disposables set');
    }
    this.disposables = new Set();
  }

  alive(): boolean {
    return this.disposables !== null;
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
    this.own(lifetime).addCallback(() => {
      this.disown(lifetime);
    });
  }

  /// Add a callback to be called when the lifetime dies
  addCallback(callback: () => void): void {
    this.own(new CallbackDisposable(callback));
  }

  /// Adds an object with a .dispose() method. .dispose() will be called when this lifetime is
  /// disposed of unless the object is deleted from it before then. The given object is returned
  /// so this call can be placed inside an expression.
  own<T extends Disposable>(disposable: T): T {
    if (this.disposables === null) {
      throw new Error('disposable can not be added to dead lifetime');
    }
    this.disposables.add(disposable);
    return disposable;
  }

  /// Delete a previously owned object without disposing of it. Does nothing if the given object is
  /// not known. The given object is returned so this call can be placed inside an expression.
  disown<T extends Disposable>(disposable: T): T {
    if (this.disposables !== null) {
      this.disposables.delete(disposable);
    }
    return disposable;
  }

  /// Calls .dispose() on all added objects. This marks the lifetime as dead and adding anything new
  /// to it will result in an error. Killing it again or deleting things from it will do nothing.
  dispose() {
    if (this.disposables !== null) {
      const disposables = this.disposables;
      this.disposables = null;
      for (const disposable of disposables) {
        disposable.dispose();
      }
    }
  }
}
