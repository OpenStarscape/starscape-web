import { Conduit, RuntimeTypeOf } from '../core';
import { SsObject } from './SsObject'
import { SsRequestType } from './SsRequest'
import { SsValue } from './SsValue'

/// An action the client can perform on a server object. We can also subscribe to it locally. Created and returned by
/// SsObject.action().
export class SsAction<T extends SsValue> extends Conduit<T> {
  constructor(
    private readonly obj: SsObject,
    private readonly name: string,
    readonly rtType: RuntimeTypeOf<T>,
  ) {
    super();
  }

  /// Fire the action, which results in a server request and local subscribers being notified.
  fire(value: T) {
    if (!this.isAlive()) {
      throw new Error('fire() called after object destroyed');
    }
    this.obj.makeRequest({
      method: SsRequestType.Fire,
      objId: this.obj.id,
      member: this.name,
      value: value,
    });
    this.sendUpdates(value);
  }
}
