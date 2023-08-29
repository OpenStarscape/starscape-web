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
  private lastReceivedTimePerTime = 1;
  private gameTimePerBrowserTime = 1;
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
      return this.lastReceivedGameTime;
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
      // Clear history as this was based on a different tpt
      this.recordedTimes.clear();
      if (tpt === 0) {
        // If we are not moving forward at all then the time prop will not get updates, so stop doing anything fancy
        this.gameTimeBase = this.lastReceivedGameTime;
      } else {
        this.gameTimeBase = this.gameTime();
        this.browserTimeBase = this.browserTime();
      }
      this.lastReceivedTimePerTime = tpt;
      this.gameTimePerBrowserTime = tpt;
    });
    this.timeProp.subscribe(hasSubscribersLt, gameTime => {
      const browserTime = this.browserTime();
      const previousGameTime = this.lastReceivedGameTime;
      this.lastReceivedGameTime = gameTime;
      // Set to the previous effective game time so we don't jump around
      this.gameTimeBase = this.gameTime();
      this.browserTimeBase = browserTime;
      if (gameTime < previousGameTime ||
          this.lastReceivedTimePerTime === 0 ||
          Math.abs(gameTime - this.gameTimeBase) > 1
      ) {
        // If game time moved backwards *on the server*, time changes while paused or we're off by more than a second
        // jump to correct time
        this.gameTimeBase = gameTime;
        this.gameTimePerBrowserTime = this.lastReceivedTimePerTime;
        this.recordedTimes.clear();
      }
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
