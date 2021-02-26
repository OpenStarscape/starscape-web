import { Conduit } from './Conduit'

/// An element that represents a local data channel.
export class LocalAction extends Conduit {
  /// Subscribers will be notified for every action fired.
  fire(value: any) {
    this.sendUpdates(value);
  }
}
