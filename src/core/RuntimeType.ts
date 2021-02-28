function throwTypeError<V>(expected: string, got: V): never {
  let gotStr;
  if (typeof got === 'object') {
    if (got === null) {
      gotStr = 'null';
    } else if (Array.isArray(got)) {
      gotStr = 'array';
    } else if ('constructor' in got) {
      gotStr = (got as any).constructor.name;
    } else {
      gotStr = 'object';
    }
  } else {
    gotStr = typeof got;
  }
  throw new Error('expected ' + expected + ', got ' + gotStr);
}

function primitiveTypeFilter<T, V>(expected: string): (_: V) => T {
  return (value): T => {
    if (typeof value === expected) {
      return value as any;
    } else {
      throwTypeError(expected, value);
    }
  }
}

function classTypeFilter<T, V>(expected: new (...args: any[]) => T): (_: V) => T {
  return (value): T => {
    if (value instanceof expected) {
      return value as any;
    } else {
      throwTypeError(expected.name, value);
    }
  }
}

export type RuntimeType = null | undefined | Array<RuntimeType> | (new (...args: any[]) => any);

type RuntimeTypeArray<T extends RuntimeType> = Array<T>;
export type RealTypeOf<T extends RuntimeType> =
  T extends null ? null :
  T extends undefined ? any :
  T extends RuntimeTypeArray<infer U> ? Array<RealTypeOf<U>> :
  T extends new (...args: any[]) => infer U ? U :
  never;

export function typeFilter<T extends RuntimeType, V=unknown>(t: T): (_: V) => RealTypeOf<T> {
  // It's unclear why the `as any` casts are needed. Typescript thinks the checks will always return false but they do not.
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
    return (value): RealTypeOf<T> => {
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
  } else if (t === undefined) {
    return (value): any => value;
  } else if (t === null) {
    return (value): RealTypeOf<T> => {
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
