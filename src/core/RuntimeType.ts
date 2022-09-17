/// A RuntimeType is a value with a distinct type, that can be used for both runtime and compile time typechecks.
/// Runtime types are as follows (along with the compile-time types RealTypeOf maps them to):
/// - null            -> null
/// - undefined       -> any
/// - Boolean         -> boolean
/// - Number          -> number
/// - String          -> string
/// - {nullable: T}   -> T | null (where T is any RuntimeType)
/// - {arrayOf: T}    -> T[] (where T is any RuntimeType)
/// - T               -> T (where T is any non-generic object constructor)
/// Note there is currently not support for generic objects except arrays. If it's needed the easiest thing to do will
/// be to patch it on an object-by-object basis
export type RuntimeType =
  null |
  undefined |
  {nullable: RuntimeType} |
  {arrayOf: RuntimeType} |
  [] |
  [RuntimeType] |
  [RuntimeType, RuntimeType] |
  [RuntimeType, RuntimeType, RuntimeType] |
  Array<RuntimeType> |
  (new (...args: any[]) => any);

type RuntimeTypeTyple1<A extends RuntimeType> = [A];
type RuntimeTypeTyple2<A extends RuntimeType, B extends RuntimeType> = [A, B];
type RuntimeTypeTyple3<A extends RuntimeType, B extends RuntimeType, C extends RuntimeType> = [A, B, C];
type RuntimeTypeTyple4<
  A extends RuntimeType,
  B extends RuntimeType,
  C extends RuntimeType,
  D extends RuntimeType,
> = [A, B, C, D];
type RuntimeTypeTyple5<
  A extends RuntimeType,
  B extends RuntimeType,
  C extends RuntimeType,
  D extends RuntimeType,
  E extends RuntimeType,
> = [A, B, C, D, E];
type RuntimeTypeTyple6<
  A extends RuntimeType,
  B extends RuntimeType,
  C extends RuntimeType,
  D extends RuntimeType,
  E extends RuntimeType,
  F extends RuntimeType,
> = [A, B, C, D, E, F];
type RuntimeTypeTyple7<
  A extends RuntimeType,
  B extends RuntimeType,
  C extends RuntimeType,
  D extends RuntimeType,
  E extends RuntimeType,
  F extends RuntimeType,
  G extends RuntimeType,
> = [A, B, C, D, E, F, G];
type RuntimeTypeTyple8<
  A extends RuntimeType,
  B extends RuntimeType,
  C extends RuntimeType,
  D extends RuntimeType,
  E extends RuntimeType,
  F extends RuntimeType,
  G extends RuntimeType,
  H extends RuntimeType,
> = [A, B, C, D, E, F, G, H];
type RuntimeTypeNullable<T extends RuntimeType> = {nullable: T};
type RuntimeTypeArray<T extends RuntimeType> = {arrayOf: T};
/// Gives access to the compile-time type of a RuntimeType
type NonNullableRealTypeOf<T extends RuntimeType> =
  T extends null ? null :
  T extends undefined ? any :
  T extends BooleanConstructor ? boolean :
  T extends NumberConstructor ? number :
  T extends StringConstructor ? string:
  T extends [] ? [] :
  T extends RuntimeTypeTyple1<infer A> ? [RealTypeOf<A>] :
  T extends RuntimeTypeTyple2<infer A, infer B> ? [RealTypeOf<A>, RealTypeOf<B>] :
  T extends RuntimeTypeTyple3<infer A, infer B, infer C> ? [RealTypeOf<A>, RealTypeOf<B>, RealTypeOf<C>] :
  T extends RuntimeTypeTyple4<infer A, infer B, infer C, infer D> ?
    [RealTypeOf<A>, RealTypeOf<B>, RealTypeOf<C>, RealTypeOf<D>] :
  T extends RuntimeTypeTyple5<infer A, infer B, infer C, infer D, infer E> ?
    [RealTypeOf<A>, RealTypeOf<B>, RealTypeOf<C>, RealTypeOf<D>, RealTypeOf<E>] :
  T extends RuntimeTypeTyple6<infer A, infer B, infer C, infer D, infer E, infer F> ?
    [RealTypeOf<A>, RealTypeOf<B>, RealTypeOf<C>, RealTypeOf<D>, RealTypeOf<E>, RealTypeOf<F>] :
  T extends RuntimeTypeTyple7<infer A, infer B, infer C, infer D, infer E, infer F, infer G> ?
    [RealTypeOf<A>, RealTypeOf<B>, RealTypeOf<C>, RealTypeOf<D>, RealTypeOf<E>, RealTypeOf<F>, RealTypeOf<G>] :
  T extends RuntimeTypeTyple8<infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H> ?
    [RealTypeOf<A>, RealTypeOf<B>, RealTypeOf<C>, RealTypeOf<D>, RealTypeOf<E>, RealTypeOf<F>, RealTypeOf<G>, RealTypeOf<H>] :
  T extends RuntimeTypeArray<infer U> ? Array<RealTypeOf<U>> :
  T extends new (...args: any[]) => infer U ? U :
  never;

export type RealTypeOf<T extends RuntimeType> =
  T extends RuntimeTypeNullable<infer U> ? (NonNullableRealTypeOf<U> | null) :
  NonNullableRealTypeOf<T>;

export type RuntimeTypeOf<T> =
  T extends null ? null :
  T extends boolean ? BooleanConstructor :
  T extends number ? NumberConstructor :
  T extends string ? StringConstructor :
  T extends Object ? new (...args: any[]) => T :
  T extends [] ? [] :
  T extends [infer A] ? [RuntimeTypeOf<A>] :
  T extends [infer A, infer B] ? [RuntimeTypeOf<A>, RuntimeTypeOf<B>] :
  T extends [infer A, infer B, infer C] ? [RuntimeTypeOf<A>, RuntimeTypeOf<B>, RuntimeTypeOf<C>] :
  T extends [infer A, infer B, infer C, infer D] ?
    [RuntimeTypeOf<A>, RuntimeTypeOf<B>, RuntimeTypeOf<C>, RuntimeTypeOf<D>] :
  T extends [infer A, infer B, infer C, infer D, infer E] ?
    [RuntimeTypeOf<A>, RuntimeTypeOf<B>, RuntimeTypeOf<C>, RuntimeTypeOf<D>, RuntimeTypeOf<E>] :
  T extends [infer A, infer B, infer C, infer D, infer E, infer F] ?
    [RuntimeTypeOf<A>, RuntimeTypeOf<B>, RuntimeTypeOf<C>, RuntimeTypeOf<D>, RuntimeTypeOf<E>, RuntimeTypeOf<F>] :
  T extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G] ?
    [
      RuntimeTypeOf<A>,
      RuntimeTypeOf<B>,
      RuntimeTypeOf<C>,
      RuntimeTypeOf<D>,
      RuntimeTypeOf<E>,
      RuntimeTypeOf<F>,
      RuntimeTypeOf<G>,
    ] :
  T extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H] ?
    [
      RuntimeTypeOf<A>,
      RuntimeTypeOf<B>,
      RuntimeTypeOf<C>,
      RuntimeTypeOf<D>,
      RuntimeTypeOf<E>,
      RuntimeTypeOf<F>,
      RuntimeTypeOf<G>,
      RuntimeTypeOf<H>,
    ] :
  T extends Array<infer U> ? {arrayOf: RuntimeTypeOf<U>} :
  undefined;

/// Needed sometimes because typescript is bad
export function indirectRuntimeType<T extends RuntimeType>(rtType: T) {
  return rtType as any as RuntimeTypeOf<RealTypeOf<T>>;
}

/// Needed sometimes because typescript is bad
export function indirectRealType<T>(value: T) {
  return value as any as RealTypeOf<RuntimeTypeOf<T>>;
}

/// Returns the name of a value's type. For primitive type. For example:
/// - true  -> 'boolean'
/// - 88    -> 'number'
/// - {}    -> 'object'
/// -> [1]  -> 'array' (does not try to work out inner type)
/// for objects of classes it returns the class name.
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

/// Returns true if two runtime types are equal
export function runtimeTypeEquals(a: RuntimeType, b: RuntimeType): boolean {
  if (a === b) {
    return true;
  } else if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a !== null &&
    b !== null
  ) {
    if ('nullable' in a && 'nullable' in b) {
      return runtimeTypeEquals(a.nullable, b.nullable);
    } else if ('arrayOf' in a && 'arrayOf' in b) {
      return runtimeTypeEquals(a.arrayOf, b.arrayOf);
    } else if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === b.length) {
        for (let i = 0; i < a.length; i++) {
          if (!runtimeTypeEquals(a[i], b[i])) {
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
  } else {
    return false;
  }
}

/// Returns the name of a runtime type. Sort of like typeName() for runtime types, except it returns
/// 'number[]' instead of 'array'
export function runtimeTypeName(t: RuntimeType): string {
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
      if (typeof t === 'object') {
        if ('nullable' in (t as any)) {
          return runtimeTypeName((t as any).nullable) + '?';
        } else if ('arrayOf' in (t as any)) {
          return runtimeTypeName((t as any).arrayOf) + '[]';
        } else if (Array.isArray(t)) {
          let result = '';
          for (let i = 0; i < t.length; i++) {
            if (i !== 0) {
              result += ', ';
            }
            result += runtimeTypeName(t[i]);
          }
          return '[' + result + ']';
        }
      } else if ('name' in (t as any) && typeof (t as any).name === 'string') {
        return (t as any).name;
      }

      throw Error('invalid RuntimeType, can not get name');
  }
}

function typeErrorMessage<T extends RuntimeType>(value: unknown, t: T): string {
  if (Array.isArray(t) && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!isType(value[i], t[0])) {
        return 'at array index ' + i + ': ' + typeErrorMessage(value[i], t[0]);
      }
    }
  }
  return 'expected ' + runtimeTypeName(t) + ', got ' + typeName(value) + ' (' + String(value) + ')';
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
      switch (typeof t) {
        case 'function':
          return (
            typeof value === 'object' &&
            value !== null &&
            (value as any).constructor === t
          );
        case 'object':
          if ('nullable' in t!) {
            return value === null || isType(value, t.nullable);
          } else if ('arrayOf' in t!) {
            if (Array.isArray(value)) {
              for (let i = 0; i < value.length; i++) {
                if (!isType(value[i], (t as any).arrayOf)) {
                  return false;
                }
              }
              return true;
            }
          } else if (Array.isArray(t)) {
            if (Array.isArray(value)) {
              if (t.length === value.length) {
                for (let i = 0; i < value.length; i++) {
                  if (!isType(value[i], t[i])) {
                    return false;
                  }
                }
                return true;
              }
            }
          }
      }
    return false;
  }
}

export function assertIsType<T, R extends RuntimeType = RuntimeTypeOf<T>>(value: unknown, t: R): asserts value is T {
  if (!isType(value, t)) {
    throw Error(typeErrorMessage(value, t));
  }
}
