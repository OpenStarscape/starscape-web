/// A RuntimeType is a value with a distinct type, that can be used for both runtime and compile time typechecks.
/// Runtime types are as follows (along with the compile-time types RealTypeOf maps them to):
/// - null -> null
/// - undefined -> any
/// - Boolean -> boolean
/// - Number -> number
/// - String -> string
/// - [T] -> T[] (where T is any other RuntimeType)
/// - T -> T (where T is any non-generic object constructor)
/// Note there is currently not support for generic objects except arrays. If it's needed the easiest thing to do will
/// be to patch it on an object-by-object basis
export type RuntimeType = null | undefined | Array<RuntimeType> | (new (...args: any[]) => any);

type RuntimeTypeArray<T extends RuntimeType> = Array<T>;
/// Gives access to the compile-time type of a RuntimeType
export type RealTypeOf<T extends RuntimeType> =
  T extends null ? null :
  T extends undefined ? any :
  T extends BooleanConstructor ? boolean :
  T extends NumberConstructor ? number :
  T extends StringConstructor ? string:
  T extends RuntimeTypeArray<infer U> ? Array<RealTypeOf<U>> :
  T extends new (...args: any[]) => infer U ? U :
  never;

export type RuntimeTypeOf<T> =
  T extends null ? null :
  T extends boolean ? BooleanConstructor :
  T extends number ? NumberConstructor :
  T extends string ? StringConstructor :
  T extends Array<infer T> ? Array<RuntimeTypeOf<T>> :
  T extends Object ? new (...args: any[]) => T :
  undefined;

export function typeName(value: any): string {
  if (typeof value === 'object') {
    if (value === null) {
      return 'null';
    } else if (Array.isArray(value)) {
      return 'array';
    } else if ('constructor' in value &&
      ((value as any).constructor !== Object) &&
      (typeof (value as any).constructor === 'function')
    ) {
      return ((value as any).constructor as () => void).name;
    } else {
      return 'object';
    }
  } else {
    return typeof value;
  }
}

export function runtimeTypeEquals(a: RuntimeType, b: RuntimeType): boolean {
  if (a === b) {
    return true;
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length === 1 && b.length === 1) {
      return runtimeTypeEquals(a[0], b[0]);
    } else {
      throw Error('RuntimeType array with invalid length');
    }
  } else {
    return false;
  }
}

function runtimeTypeName(t: RuntimeType): string {
  switch (t as any) {
    case null:
      return 'null';
    case undefined:
      return 'any';
    case Boolean:
      return 'boolean';
    case Number:
      return 'number';
    case String:
      return 'string';
    default:
      if (Array.isArray(t)) {
        if (t.length !== 1) {
          throw Error('invalid RuntimeType. arrays must be length 1, not ' + t.length);
        } else {
          return 'array';
          //return runtimeTypeName(t[0]) + '[]';
        }
      } else if ('name' in (t as any) && typeof (t as any).name === 'string') {
        return (t as any).name;
      } else {
        throw Error('invalid RuntimeType, can not get name');
      }
  }
}

function typeErrorMessage<T extends RuntimeType>(value: unknown, t: T): string {
  if (Array.isArray(t) && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!isType(value[i], t[0])) {
        return 'inside array: ' + typeErrorMessage(value[i], t[0]);
      }
    }
  }
  return 'expected ' + runtimeTypeName(t) + ', got ' + typeName(value);
}

export function isType<T extends RuntimeType>(value: unknown, t: T): boolean {
  switch (t as any) {
    case null:
      return value === null;
    case undefined:
      return true;
    case Boolean:
      return typeof value === 'boolean';
    case Number:
      return typeof value === 'number';
    case String:
      return typeof value === 'string';
    default:
      if (typeof t === 'function') {
        return (
          typeof value === 'object' &&
          value !== null &&
          (value as any).constructor === t
        );
      } else if (Array.isArray(t)) {
        if (t.length !== 1) {
          throw Error('invalid RuntimeType. arrays must be length 1, not ' + t.length);
        }
        else if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (!isType(value[i], t[0])) {
              return false;
            }
          }
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
  }
}

export function assertIsType<T extends RuntimeType>(value: unknown, t: T): asserts value is RealTypeOf<T> {
  if (!isType(value, t)) {
    throw Error(typeErrorMessage(value, t));
  }
}
