import { Conduit, Lifetime, Subscriber } from '../core';

export type FramerateInfo = {
  average: number,
  min: number,
}

/// Tracks the framerate of a single scene, reports min and average FPS of the sample size respectively
export class FramerateTracker extends Conduit<FramerateInfo> {
  private frames: number[] = [];
  private info: FramerateInfo | null = null;

  constructor(
    readonly samples: number = 20,
    readonly getCurrentMs: () => number = () => performance.now(),
  ) {
    super();
  }

  initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.frames = [];
      this.info = null;
    });
  }

  subscriberAdded(subscriber: Subscriber<FramerateInfo>): void {
    if (this.info !== null) {
      subscriber.sendValue(this.info);
    }
  }

  private averageFps(): number {
    const elapsedMs = this.frames[this.frames.length - 1] - this.frames[0];
    const averageMs = elapsedMs / (this.frames.length - 1);
    return 1000 / averageMs;
  }

  private minFps(): number {
    let maxMs = 0;
    for (let i = 0; i < this.frames.length - 1; i++) {
      const ms = this.frames[i + 1] - this.frames[i];
      if (ms > maxMs) {
        maxMs = ms;
      }
    }
    return 1000 / maxMs;
  }

  recordFrame() {
    if (!this.hasSubscribers()) {
      return;
    }
    this.frames.push(this.getCurrentMs());
    let send = false;
    if (this.frames.length >= 2) {
      const averageFps = this.averageFps();
      const minFps = this.minFps();
      if (this.info === null ||
          averageFps !== this.info.average ||
          minFps !== this.info.min
      ) {
        send = true;
      }
      this.info = {
        average: averageFps,
        min: minFps,
      }
    }
    while (this.frames.length > this.samples) {
      this.frames.shift();
    }
    if (send) {
      this.sendToAllSubscribers(this.info!);
    }
  }

  get(): FramerateInfo | null {
    return this.info;
  }
}

/// Connects to potentially multiple FramerateTrackers and reports the one with the lowest framerate
export class FramerateReporter extends Conduit<number> {
  private trackers = new Map<FramerateTracker, Lifetime>();
  private value: number = 0;

  constructor(
    private readonly fpsFromInfo: (info: FramerateInfo) => number,
  ) {
    super();
  }

  private update() {
    let min = null;
    for (const [tracker, _lt] of this.trackers) {
      const info = tracker.get();
      if (info !== null) {
        const fps = this.fpsFromInfo(info);
        if (min === null || fps < min) {
          min = fps
        }
      }
    }
    const nonNull = min === null ? 0 : min;
    if (nonNull !== this.value) {
      this.value = nonNull;
      this.sendToAllSubscribers(nonNull);
    }
  }

  private subscribeToTracker(trackerLt: Lifetime, tracker: FramerateTracker) {
    const lt = trackerLt.newDependent();
    this.hasSubscribersLt!.addDependent(lt);
    tracker.subscribe(lt, _info => {
      this.update();
    });
    lt.addCallback(() => {
      this.update();
    });
    this.update();
  }

  initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    hasSubscribersLt.addCallback(() => {
      this.value = 0;
    });
    for (const [tracker, lt] of this.trackers) {
      this.subscribeToTracker(lt, tracker);
    }
  }

  subscriberAdded(subscriber: Subscriber<number>): void {
    if (this.value !== null) {
      subscriber.sendValue(this.value);
    }
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

  get(): number {
    return this.value;
  }
}
