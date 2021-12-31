import { Conduit, RuntimeTypeOf } from '../core';
import { SsObject } from './SsObject'
import { SsValue } from './SsValue'

/// A conduit for a starscape object member
export abstract class SsConduit<T extends SsValue> extends Conduit<T> {
  constructor(
    protected readonly obj: SsObject,
    protected readonly name: string,
    readonly rtType: RuntimeTypeOf<T>,
  ) {
    super();
  }

  /// The type of the conduit (property, signal or action)
  abstract typeName(): string;
}
