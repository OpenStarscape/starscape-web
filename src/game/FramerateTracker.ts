import { Conduit, Lifetime, Subscriber } from '../core';
import { AnimationTimer } from './AnimationTimer';

export type FramerateInfo = {
  average: number,
  worst: number,
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

  private averageFrameTime(): number {
    const elapsedTime = this.frames[this.endIndex()] - this.frames[this.startIndex()];
    const elapsedFrames = this.frames.length - 1;
    return elapsedTime / elapsedFrames;
  }

  private worstFrameTime(): number {
    const start = this.startIndex();
    const end = this.endIndex();
    if (this.info !== null && this.indexOfMin !== null && this.indexOfMin !== end) {
      const almostEndIndex = end === 0 ? this.frames.length - 1 : end - 1;
      const mostRecentTime = this.frames[end] - this.frames[almostEndIndex];
      if (mostRecentTime > this.info.worst) {
        this.indexOfMin = almostEndIndex;
        return mostRecentTime;
      } else {
        return this.info.worst;
      }
    } else {
      let maxTime = 0;
      for (let i = start; i != end; i = (i + 1) % this.frames.length) {
        const nextIndex = (i + 1) % this.frames.length;
        const time = this.frames[nextIndex] - this.frames[i];
        if (time > maxTime) {
          maxTime = time;
          this.indexOfMin = i;
        }
      }
      return maxTime;
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
    if (this.frames.length >= 2) {
      const averageFrame = this.averageFrameTime();
      const worstFrame = this.worstFrameTime();
      if (this.info === null ||
          this.info.average !== averageFrame ||
          this.info.worst !== worstFrame
      ) {
        this.info = {
          average: averageFrame,
          worst: worstFrame,
        }
        this.sendToAllSubscribers(this.info);
      }
    } else {
      this.info = null;
    }
  }

  get(): FramerateInfo | null {
    return this.info;
  }
}
