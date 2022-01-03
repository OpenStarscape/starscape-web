import { LocalProperty, Lifetime } from '../core';
import { FramerateReporter } from './FramerateTracker';
import { SsConnection, SsSessionType, SsObject, SsSet } from '../protocol';

export class Game extends Lifetime {
  readonly connection: SsConnection;
  readonly root: SsObject;
  readonly bodies: SsSet<SsObject>;
  /// The Starscape object of the currently controlled ship
  readonly currentShip = new LocalProperty<SsObject | null>(null);
  readonly averageFps = new FramerateReporter(info => info.average);
  readonly minFps = new FramerateReporter(info => info.min);
  private lastGameTime = 0;
  private timeBase = 0;

  public currentTime = 0;

  constructor() {
    super();
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.root = this.connection.root;
    this.root.property('time', Number).subscribe(this, time => {
      this.lastGameTime = time;
      this.timeBase = this.currentTime;
    });
    this.bodies = new SsSet(this.root.property('bodies', {arrayOf: SsObject}));
  }

  frameTime() {
    // TODO: keep this stable across a frame
    return (this.currentTime - this.timeBase) / 1000 + this.lastGameTime;
  }
}
