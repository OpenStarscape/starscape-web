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
/// as subscribers (these are created automatically when conduits are subscribed to). accessing
/// a Lifetime does not give permission to kill it, for that you need a derived class such as
/// DependentLifetime
export abstract class Lifetime {
  private disposables: Set<Disposable> | null = new Set();
  private dependents: Set<DependentLifetime> | null = new Set();

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
  newDependent(): DependentLifetime {
    const dependent = new DependentLifetime();
    this.addDependent(dependent);
    return dependent;
  }

  /// Make a DependentLifetime depend on this lifetime, so if this lifetime dies it will also kill
  /// the dependent. A DependentLifetime can depend on multiple other lifetimes, and will die as
  /// soon as any of them do.
  addDependent<T extends DependentLifetime>(dependent: T): T {
    if (this.dependents === null) {
      throw new Error('disposable can not be added to dead lifetime');
    }
    this.dependents.add(dependent);
    dependent.addCallback(() => {
      if (this.dependents !== null) {
        this.dependents.delete(dependent)
      }
    });
    return dependent;
  }

  /// Add a callback to be called when the lifetime dies
  addCallback(callback: () => void): void {
    this.own(new CallbackDisposable(callback));
  }

  /// The callback will be called only once the first time one of the given lifetimes dies
  static addCallbackToAll(lts: Lifetime[], callback: () => void): void {
    const disposable = new CallbackDisposable(callback);
    for (const lt of lts) {
      lt.own(disposable);
    }
  }

  /// Adds an object with a .dispose() method. .dispose() will be called when this lifetime is
  /// disposed of unless the object is deleted from it before then. The given object is returned
  /// so this call can be placed inside an expression.
  own<T extends Disposable>(disposable: T): T {
    if (this.disposables === null) {
      throw new Error('dead lifetime can not own new things');
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
  protected killLifetime(): void {
    if (this.disposables !== null) {
      const disposables = this.disposables;
      this.disposables = null;
      for (const disposable of disposables) {
        disposable.dispose();
      }
    }
    if (this.dependents !== null) {
      const dependents = this.dependents;
      this.dependents = null;
      for (const dependent of dependents) {
        dependent.kill();
      }
    }
  }
}

export class DependentLifetime extends Lifetime {
  /// Explicitly kills this lifetime, calls .dispose on all owned disposables and kills any dependents
  kill() {
    this.killLifetime();
  }
}
