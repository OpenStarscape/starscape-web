import { SsValue } from './SsValue'

function throwTypeError(expected: string, got: SsValue): never {
  let gotStr;
  if (typeof got === 'object') {
    if (got === null) {
      gotStr = 'null';
    } else if (Array.isArray(got)) {
      gotStr = 'array';
    } else {
      gotStr = got.constructor.name;
    }
  } else {
    gotStr = typeof got;
  }
  throw new Error('expected ' + expected + ', got ' + gotStr);
}

function primitiveTypeFilter<T>(expected: string): (_: SsValue) => T {
  return (value): T => {
    if (typeof value === expected) {
      return value as any;
    } else {
      throwTypeError(expected, value);
    }
  }
}

function classTypeFilter<T>(expected: new (...args: any[]) => T): (_: SsValue) => T {
  return (value): T => {
    if (value instanceof expected) {
      return value as any;
    } else {
      throwTypeError(expected.name, value);
    }
  }
}

// For runtime type checking. Tbh even while I'm writing this idk how or why it works.
export type SsRuntimeType<T, U=undefined> =
  T extends null ? null :
  T extends Array<U> ? Array<U> :
  new (...args: any[]) => T;

export function typeFilter(t: null): (_: SsValue) => null;
export function typeFilter<T, U>(t: Array<SsRuntimeType<T, U>>): (_: SsValue) => Array<SsRuntimeType<T, U>>;
export function typeFilter<T>(t: new (...args: any[]) => T): (_: SsValue) => T;
export function typeFilter<T, U>(t: SsRuntimeType<T, U>): (_: SsValue) => T;
export function typeFilter<T, U>(t: SsRuntimeType<T, U>): (_: SsValue) => T {
  // Without the `as any` casts, the compiler complains the checks always return false.
  // The compiler is wrong and I have tests to prove it.
  if (t as any === Boolean) {
    return primitiveTypeFilter('boolean')
  } else if (t as any === Number) {
    return primitiveTypeFilter('number')
  } else if (t as any === String) {
    return primitiveTypeFilter('string')
  } else if (typeof t as any === 'function') {
    return classTypeFilter(t as any);
  } else if (Array.isArray(t)) {
    if (t.length != 1) {
      throw new Error('invalid runtime type array ' + t + ', must have single element');
    }
    const inner = typeFilter(t[0] as any);
    return (value): T => {
      if (!Array.isArray(value)) {
        throwTypeError('array', value);
      }
      try {
        for (let i = 0; i < value.length; i++) {
          inner(value[i]);
        }
      } catch (e) {
        throw new Error('inside array: ' + e.message);
      }
      return value as any;
    };
  } else if (t == null) {
    return (value): T => {
      if (value === null) {
        return null as any;
      } else {
        throwTypeError('null', value);
      }
    };
  } else {
    throw new Error('Invalid runtime type: ' + t);
  }
}
