import { LocalProperty, Lifetime } from '../core';
import { FramerateReporter } from './FramerateTracker';
import { SsConnection, SsSessionType, SsObject } from '../protocol';

export interface Game {
  readonly connection: SsConnection;
  readonly god: SsObject;
  readonly currentShip: LocalProperty<SsObject | null>;
  readonly fps: FramerateReporter;
  /// Time in in-game seconds of the current frame. The last starscape timestamp, plus the time
  /// since it arived and then only updated each rendered frame
  frameTime(): number;
}

export class GameImpl extends Lifetime {
  readonly connection: SsConnection;
  readonly god: SsObject;
  /// The Starscape object of the currently controlled ship
  readonly currentShip = new LocalProperty<SsObject | null>(null);
  readonly fps = new FramerateReporter();
  private lastGameTime = 0;
  private timeBase = 0;

  constructor() {
    super();
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.god = this.connection.god;
    this.god.property('time', Number).subscribe(this, time => {
      this.lastGameTime = time;
      this.timeBase = performance.now();
    });
  }

  frameTime() {
    // TODO: keep this stable across a frame
    return (performance.now() - this.timeBase) / 1000 + this.lastGameTime;
  }
}
