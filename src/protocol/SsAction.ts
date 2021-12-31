import { SsConduit } from './SsConduit'
import { SsRequestType } from './SsRequest'
import { SsValue } from './SsValue'

/// An action the client can perform on a server object. We can also subscribe to it locally. Created and returned by
/// SsObject.action().
export class SsAction<T extends SsValue> extends SsConduit<T> {
  typeName(): string {
    return 'action';
  }

  /// Fire the action, which results in a server request and local subscribers being notified.
  fire(value: T) {
    this.verifyObjAlive('fire');
    this.obj.makeRequest({
      method: SsRequestType.Fire,
      objId: this.obj.id,
      member: this.name,
      value: value,
    });
    this.sendToAllSubscribers(value);
  }
}
