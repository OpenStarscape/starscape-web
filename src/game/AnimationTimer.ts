import { Conduit, Lifetime, Subscriber } from '../core';
import { SsObject } from '../protocol';

/// Handles calling requestAnimationFrame and keeping track of game time
export class AnimationTimer extends Conduit<null> {
  private animationFrameTime: number | null = null;
  private gameTimeOffset: number | null = null;
  private readonly timeProp;

  constructor(
    root: SsObject,
    private readonly getBrowserTime: () => number = () => performance.now() / 1000,
    private readonly requestAnimFrame:
      (callback: (ms: number) => void) => void
      = callback => requestAnimationFrame(callback),
  ) {
    super();
    this.timeProp = root.property('time', Number);
  }

  /// Time (in seconds) of last animation frame
  browserTime(): number {
    return this.animationFrameTime !== null ? this.animationFrameTime : this.getBrowserTime();
  }

  gameTime(): number | null {
    return this.gameTimeOffset !== null ? this.browserTime() + this.gameTimeOffset : null;
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
    this.timeProp.subscribe(hasSubscribersLt, gameTime => {
      this.gameTimeOffset = gameTime - this.browserTime();
    });
  }

  protected subscriberAdded(subscriber: Subscriber<null>): void {
    subscriber.sendValue(null);
  }
}
