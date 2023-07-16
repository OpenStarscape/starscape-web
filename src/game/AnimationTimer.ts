import { Conduit, Lifetime, Subscriber } from '../core';
import { SsObject } from '../protocol';

/// Handles calling requestAnimationFrame and keeping track of game time
export class AnimationTimer extends Conduit<null> {
  private animationFrameTime: number | null = null;
  private browserTimeAtLastGameTime: number | null = null;
  private lastGameTime: number | null = null;
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

  gameTime(): number | null {
    if (this.browserTimeAtLastGameTime === null ||
        this.lastGameTime === null
    ) {
      return null;
    } else {
      return (this.browserTime() - this.browserTimeAtLastGameTime) *
        this.gameTimePerBrowserTime +
        this.lastGameTime;
    }
  }

  protected handleAnimFrame(ms: number) {
    this.animationFrameTime = ms / 1000;
    this.sendToAllSubscribers(null);
    if (this.hasSubscribers()) {
      this.requestAnimFrame(ms => this.handleAnimFrame(ms));
    }
    this.animationFrameTime = null;
  }

  protected initialSubscriberAdded(hasSubscribersLt: Lifetime): void {
    this.requestAnimFrame(ms => this.handleAnimFrame(ms));
    hasSubscribersLt.addCallback(() => {
    })
    this.timePerTimeProp.subscribe(hasSubscribersLt, tpt => {
      this.gameTimePerBrowserTime = tpt;
    });
    this.timeProp.subscribe(hasSubscribersLt, gameTime => {
      const browserTime = this.browserTime();
      if (this.lastGameTime !== null &&
          this.browserTimeAtLastGameTime !== null &&
          browserTime - this.browserTimeAtLastGameTime > 0.001
      ) {
        this.gameTimePerBrowserTime = (gameTime - this.lastGameTime) /
          (browserTime - this.browserTimeAtLastGameTime);
      }
      this.lastGameTime = gameTime;
      this.browserTimeAtLastGameTime = this.browserTime();
    });
  }

  protected subscriberAdded(_subscriber: Subscriber<null>): void {}
}
