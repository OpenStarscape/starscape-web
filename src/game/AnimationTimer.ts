import { Conduit, Lifetime, Subscriber, RingBuffer } from '../core';
import { SsObject } from '../protocol';

const lookBack = 3, lookAhead = 2;

/// Handles calling requestAnimationFrame and keeping track of game time
export class AnimationTimer extends Conduit<null> {
  private animationFrameTime: number | null = null;
  private animationFrameRequested = false;
  private recordedTimes = new RingBuffer<[number, number]>();
  private lastReceivedGameTime = 0;
  private browserTimeBase: number | null = null;
  private gameTimeBase: number | null = null;
  private gameTimePerBrowserTime: number = 1;
  private readonly timeProp;
  private readonly timePerTimeProp;

  constructor(
    root: SsObject,
    private readonly getBrowserTime: () => number = () => performance.now() / 1000,
    private readonly requestAnimFrame:
      (callback: (ms: number) => void) => void
      = callback => requestAnimationFrame(callback),
  ) {
    super();
    this.timeProp = root.property('time', Number);
    this.timePerTimeProp = root.property('time_per_time', Number);
  }

  /// Time (in seconds) of last animation frame
  browserTime(): number {
    return this.animationFrameTime !== null ? this.animationFrameTime : this.getBrowserTime();
  }

  gameTime(): number {
    if (this.browserTimeBase === null ||
        this.gameTimeBase === null
    ) {
      return 0;
    } else {
      return (this.browserTime() - this.browserTimeBase) *
        this.gameTimePerBrowserTime +
        this.gameTimeBase;
    }
  }

  lastGameTime(): number {
    return this.lastReceivedGameTime;
  }

  protected handleAnimFrame(ms: number) {
    this.animationFrameTime = ms / 1000;
    this.sendToAllSubscribers(null);
    if (this.hasSubscribers()) {
      this.requestAnimFrame(ms => this.handleAnimFrame(ms));
    } else {
      this.animationFrameRequested = false;
    }
    this.animationFrameTime = null;
  }

  protected initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    if (!this.animationFrameRequested) {
      this.requestAnimFrame(ms => this.handleAnimFrame(ms));
      this.animationFrameRequested = true;
    }
    hasSubscribersLt.addCallback(() => {
      this.recordedTimes.clear();
      this.gameTimePerBrowserTime = 0;
    });
    this.timePerTimeProp.subscribe(hasSubscribersLt, tpt => {
      if (this.recordedTimes.length()) {
        // Reset back to known correct times to keep things getting weird (tolorate a jump)
        this.browserTimeBase = this.recordedTimes.at(-1)[0];
        this.gameTimeBase = this.recordedTimes.at(-1)[1];
        // Clear history as this was based on a different game state
        this.recordedTimes.clear();
      }
      this.gameTimePerBrowserTime = tpt;
    });
    this.timeProp.subscribe(hasSubscribersLt, gameTime => {
      const browserTime = this.browserTime();
      this.lastReceivedGameTime = gameTime;
      // Set to the previous effective game time so we don't jump around
      this.gameTimeBase = this.gameTime() || gameTime;
      this.browserTimeBase = browserTime;
      while (this.recordedTimes.length() > 1 &&
        this.recordedTimes.at(0)[0] < browserTime - lookBack
      ) {
        this.recordedTimes.popFront();
      }
      this.recordedTimes.pushBack([browserTime, gameTime]);
      if (this.recordedTimes.length() > 1) {
        const [oldBrowserTime, oldGameTime] = this.recordedTimes.at(0);
        const empiricalGameTimePerBrowserTime = (gameTime - oldGameTime) /
          (browserTime - oldBrowserTime);
        const predictedFutureGameTime = gameTime + empiricalGameTimePerBrowserTime * lookAhead;
        const timeRateForConvergence = (predictedFutureGameTime - this.gameTimeBase) / lookAhead;
        this.gameTimePerBrowserTime = timeRateForConvergence;
      }
    });
  }

  protected subscriberAdded(_subscriber: Subscriber<null>): void {}
}
