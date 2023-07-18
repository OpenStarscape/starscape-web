import { Conduit, Lifetime, RingBuffer, Subscriber } from '../core';
import { AnimationTimer } from './AnimationTimer';

export type FramerateInfo = {
  average: number,
  worst: number,
}

/// Tracks the framerate of a single scene, reports min and average FPS of the sample size respectively
export class FramerateTracker extends Conduit<FramerateInfo> {
  private frames = new RingBuffer<number>();
  private info: FramerateInfo | null = null;
  private slowestFrame: number = -1;
  private indexOfSlowest: number = -1;

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
      this.info = null;
      this.indexOfSlowest = -1;
    });
  }

  subscriberAdded(subscriber: Subscriber<FramerateInfo>): void {
    if (this.info !== null) {
      subscriber.sendValue(this.info);
    }
  }

  private averageFrameTime(): number {
    const elapsedTime = this.frames.at(-1) - this.frames.at(0);
    const elapsedFrames = this.frames.length();
    return elapsedTime / elapsedFrames;
  }

  private worstFrameTime(): number {
    if (this.indexOfSlowest < 0) {
      this.slowestFrame = 0;
      for (let i = 1; i < this.frames.length(); i++) {
        let time = this.frames.at(i) - this.frames.at(i - 1);
        if (time > this.slowestFrame) {
          this.slowestFrame = time;
          this.indexOfSlowest = i;
        }
      }
    } else {
      const latest = this.frames.at(-1) - this.frames.at(-2);
      if (latest > this.slowestFrame) {
        this.indexOfSlowest = this.frames.length() - 1;
        this.slowestFrame
      }
    }
    return this.slowestFrame;
  }

  private addRecord(ms: number) {
    if (this.frames.length() >= this.samples) {
      this.frames.popFront();
      this.indexOfSlowest--;
    }
    this.frames.pushBack(ms);
  }

  private recordFrame() {
    if (!this.hasSubscribers()) {
      return;
    }
    this.addRecord(this.timer.browserTime());
    if (this.frames.length() >= 2) {
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
