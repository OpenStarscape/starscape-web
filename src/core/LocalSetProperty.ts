import { SetConduitImpl } from './SetConduitImpl';

export class LocalSetProperty<T> extends SetConduitImpl<T> {
  add(value: T): void {
    super.add(value);
  }

  delete(value: T): void {
    super.delete(value);
  }

  clear(): void {
    super.clear();
  }
}
