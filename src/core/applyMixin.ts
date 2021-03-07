export function applyMixin(
  derivedCtor: new (...args: any[]) => any,
  baseCtor: new (...args: any[]) => any
): void {
  for (const prop of Object.getOwnPropertyNames(baseCtor.prototype)) {
    if (prop !== 'constructor') {
      Object.defineProperty(
        derivedCtor.prototype,
        prop,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, prop) || Object.create(null),
      );
    }
  }
}
