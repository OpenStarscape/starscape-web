import { Conduit, Lifetime } from '../core';

/// Tracks the framerate of a single scene
export class FramerateTracker extends Conduit<number> {
  private frames: number[] = [];

  constructor(
    readonly samples: number = 20,
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

/// Connects to potentially multiple FramerateTrackers and reports the one with the lowest framerate
export class FramerateReporter extends Conduit<number | null> {
  private currentTracker: FramerateTracker | null = null;

  constructor() {
    super();
    this.value = null;
  }

  addTracker(lt: Lifetime, tracker: FramerateTracker) {
    tracker.subscribe(lt, fps => {
      let newValue = this.value;
      if (this.currentTracker === tracker) {
        newValue = fps;
      } else if (this.value === null || this.value === undefined || fps < this.value) {
        this.currentTracker = tracker;
        newValue = fps;
      }
      if (newValue !== this.value) {
        this.value = newValue;
        this.sendUpdates(newValue!);
      }
    });
    lt.addCallback(() => {
      if (this.currentTracker === tracker) {
        this.currentTracker = null;
        if (this.value !== null) {
          this.value = null;
          this.sendUpdates(null);
        }
      }
    });
  }

  get(): number | null {
    // TODO: use type system to make sure value is not undefined
    return this.value!;
  }
}
