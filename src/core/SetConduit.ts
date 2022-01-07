import { Conduit } from './Conduit';
import { Lifetime } from './Lifetime';

/// A set which can be subscribed to. When first subscribed, a subscriber is notified of each item
/// in the set. It is then notified of any new items that are added. Each item has it's own
/// lifetime. When an item is removed from the set, it's lifetime is killed.
export interface SetConduit<T> extends Conduit<[Lifetime, T]> {
  has(value: T): boolean;
  keys(): IterableIterator<T>;
};
