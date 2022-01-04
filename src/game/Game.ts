import { LocalProperty, Lifetime } from '../core';
import { FramerateReporter, FramerateTracker } from './FramerateTracker';
import { AnimationTimer } from './AnimationTimer';
import { SsConnection, SsSessionType, SsObject, SsSet } from '../protocol';

export class Game extends Lifetime {
  readonly connection: SsConnection;
  readonly root: SsObject;
  readonly bodies: SsSet<SsObject>;
  /// The Starscape object of the currently controlled ship
  readonly currentShip = new LocalProperty<SsObject | null>(null);
  readonly animation;
  readonly averageFps = new FramerateReporter(info => info.average);
  readonly minFps = new FramerateReporter(info => info.min);
  readonly tracker;

  constructor() {
    super();
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.root = this.connection.root;
    this.bodies = new SsSet(this.root.property('bodies', {arrayOf: SsObject}));
    this.animation = new AnimationTimer(this.root);
    this.tracker = new FramerateTracker(this.animation);
    this.averageFps.addTracker(this, this.tracker);
    this.minFps.addTracker(this, this.tracker);
  }
}
