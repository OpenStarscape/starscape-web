import { Conduit, Lifetime, Subscriber } from '../core';

/// Tracks the framerate of a single scene
export class FramerateTracker extends Conduit<number> {
  private frames: number[] = [];
  private value: number | null = null;

  constructor(
    readonly samples: number = 20,
    readonly getCurrentMs: () => number = () => performance.now(),
  ) {
    super();
  }

  initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.frames = [];
      this.value = null;
    });
  }

  subscriberAdded(subscriber: Subscriber<number>): void {
    if (this.value !== null) {
      subscriber.sendValue(this.value);
    }
  }

  recordFrame() {
    if (!this.hasSubscribers()) {
      return;
    }
    this.frames.push(this.getCurrentMs());
    let newFps = null;
    if (this.frames.length >= 2) {
      const elapsedMs = this.frames[this.frames.length - 1] - this.frames[0];
      const averageMs = elapsedMs / (this.frames.length - 1);
      newFps = 1000 / averageMs;
    }
    while (this.frames.length > this.samples) {
      this.frames.shift();
    }
    if (newFps !== null && this.value !== newFps) {
      this.value = newFps;
      this.sendToAllSubscribers(newFps);
    }
  }

  get(): number | null {
    return this.value;
  }
}

/// Connects to potentially multiple FramerateTrackers and reports the one with the lowest framerate
export class FramerateReporter extends Conduit<number | null> {
  private currentTracker: FramerateTracker | null = null;
  private trackers = new Map<FramerateTracker, Lifetime>();
  private value: number | null = null;

  private subscribeToTracker(trackerLt: Lifetime, tracker: FramerateTracker) {
    if (this.hasSubscribersLt === null) {
      return;
    }
    const lt = trackerLt.newChild();
    this.hasSubscribersLt.addChild(lt);
    tracker.subscribe(lt, fps => {
      let newValue = this.value;
      if (this.currentTracker === tracker) {
        newValue = fps;
      } else if (this.value === null || fps < this.value) {
        this.currentTracker = tracker;
        newValue = fps;
      }
      if (newValue !== this.value) {
        this.value = newValue;
        this.sendToAllSubscribers(newValue);
      }
    });
    lt.addCallback(() => {
      if (this.currentTracker === tracker) {
        this.currentTracker = null;
        if (this.value !== null) {
          this.value = null;
          this.sendToAllSubscribers(null);
        }
      }
    });
  }

  initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.value = null;
      this.currentTracker = null;
    });
    for (const [tracker, lt] of this.trackers) {
      this.subscribeToTracker(lt, tracker);
    }
  }

  subscriberAdded(subscriber: Subscriber<number | null>): void {
    subscriber.sendValue(this.value);
  }

  addTracker(lt: Lifetime, tracker: FramerateTracker) {
    this.trackers.set(tracker, lt);
    lt.addCallback(() => {
      this.trackers.delete(tracker);
    })
    if (this.hasSubscribers()) {
      this.subscribeToTracker(lt, tracker);
    }
  }

  get(): number | null {
    return this.value;
  }
}
