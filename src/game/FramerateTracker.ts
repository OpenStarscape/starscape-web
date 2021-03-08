import { Conduit } from '../core';

export class FramerateTracker extends Conduit<number> {
  private frames: number[] = [];

  constructor(
    readonly samples: number = 10,
    readonly getCurrentMs: () => number = () => performance.now(),
  ) {
    super();
    this.value = 0;
  }

  recordFrame() {
    while (this.frames.length > this.samples) {
      this.frames.shift();
    }
    this.frames.push(this.getCurrentMs());
    let newFps = 0;
    if (this.frames.length >= 2) {
      const elapsedMs = this.frames[this.frames.length - 1] - this.frames[0];
      const averageMs = elapsedMs / (this.frames.length - 1);
      newFps = 1000 / averageMs;
    }
    if (this.value !== newFps) {
      this.value = newFps;
      this.sendUpdates(newFps);
    }
  }

  get(): number {
    // TODO: use type system to make sure value is not undefined
    return this.value!;
  }
}
