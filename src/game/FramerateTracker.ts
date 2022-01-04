import { Conduit, Lifetime, Subscriber } from '../core';
import { AnimationTimer } from './AnimationTimer';

export type FramerateInfo = {
  average: number,
  min: number,
}

/// Tracks the framerate of a single scene, reports min and average FPS of the sample size respectively
export class FramerateTracker extends Conduit<FramerateInfo> {
  private frames: number[] = [];
  private next = 0;
  private info: FramerateInfo | null = null;
  private indexOfMin: number | null = null;

  constructor(
    private readonly timer: AnimationTimer,
    readonly samples: number = 300,
  ) {
    super();
  }

  initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    this.timer.subscribe(hasSubscribersLt, () => {
      this.recordFrame();
    });
    hasSubscribersLt.addCallback(() => {
      this.frames = [];
      this.next = 0;
      this.info = null;
      this.indexOfMin = null;
    });
  }

  subscriberAdded(subscriber: Subscriber<FramerateInfo>): void {
    if (this.info !== null) {
      subscriber.sendValue(this.info);
    }
  }

  private startIndex() {
    return this.next < this.frames.length ? this.next : 0;
  }

  private endIndex() {
    return this.next === 0 ? this.frames.length - 1 : this.next - 1;
  }

  private averageFps(): number {
    const elapsedMs = this.frames[this.endIndex()] - this.frames[this.startIndex()];
    const elapsedFrames = this.frames.length - 1;
    return 1000 * elapsedFrames / elapsedMs;
  }

  private minFps(): number {
    const start = this.startIndex();
    const end = this.endIndex();
    if (this.info !== null && this.indexOfMin !== null && this.indexOfMin !== end) {
      const almostEndIndex = end === 0 ? this.frames.length - 1 : end - 1;
      const mostRecentMs = this.frames[end] - this.frames[almostEndIndex];
      const mostRecentFps = 1000 / mostRecentMs;
      if (mostRecentFps < this.info.min) {
        this.indexOfMin = almostEndIndex;
        return mostRecentFps;
      } else {
        return this.info.min;
      }
    } else {
      let maxMs = 0;
      for (let i = start; i != end; i = (i + 1) % this.frames.length) {
        const nextIndex = (i + 1) % this.frames.length;
        const ms = this.frames[nextIndex] - this.frames[i];
        if (ms > maxMs) {
          maxMs = ms;
          this.indexOfMin = i;
        }
      }
      return 1000 / maxMs;
    }
  }

  private addRecord(ms: number) {
    if (this.next >= this.frames.length) {
      this.frames.push(ms);
    } else {
      this.frames[this.next] = ms;
    }
    if (this.next < this.samples) {
      this.next += 1;
    } else {
      this.next = 0;
    }
  }

  private recordFrame() {
    if (!this.hasSubscribers()) {
      return;
    }
    this.addRecord(this.timer.browserTime());
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
    if (send) {
      this.sendToAllSubscribers(this.info!);
    }
  }

  get(): FramerateInfo | null {
    return this.info;
  }
}
