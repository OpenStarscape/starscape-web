export class RingBuffer<T> {
  private array: T[] = [];
  private first = 0;
  private last = -1; // -1 is special value that means there are no elements
  private privLength = 0;

  constructor() {
  }

  length(): number {
    return this.privLength;
  }

  changeCapacity(capacity: number): void {
    if (capacity < this.length()) {
      throw Error('capacity less than length');
    }
    const newArray = new Array(capacity);
    for (let i = 0; i < this.privLength; i++) {
      newArray[i] = this.at(i);
    }
    this.array = newArray;
    this.first = 0;
    this.last = this.privLength - 1;
  }

  private shrinkIfNeeded(): void {
    if (this.array.length > 16 && this.array.length > this.length() * 4) {
      this.changeCapacity(Math.floor(this.array.length / 2));
    }
  }

  pushBack(item: T): void {
    let newLast = this.last + 1;
    if (newLast >= this.array.length) {
      newLast = 0;
    }
    if (newLast == this.first) {
      this.changeCapacity(Math.max(this.array.length * 2, 16));
      newLast = this.last + 1;
    }
    this.last = newLast;
    this.privLength++;
    this.array[newLast] = item;
  }

  popFront(): T {
    if (this.last < 0) {
      throw Error('ring buffer empty');
    }
    const val = this.array[this.first];
    this.privLength--;
    if (this.privLength == 0) {
      this.first = 0;
      this.last = -1;
    } else {
      this.first++;
      if (this.first >= this.array.length) {
        this.first = 0;
      }
    }
    this.shrinkIfNeeded();
    return val;
  }

  at(index: number): T {
    if (index < 0) {
      index = this.privLength + index;
    }
    if (index < 0 || index >= this.privLength) {
      throw Error('index out of range');
    }
    index = this.first + index;
    if (index >= this.array.length) {
      index -= this.array.length;
    }
    return this.array[index];
  }
}
