import { LocalProperty, Lifetime, SetConduit } from '../core';
import { FramerateTracker } from './FramerateTracker';
import { AnimationTimer } from './AnimationTimer';
import { SpatialManager } from './SpatialManager';
import { SsConnection, SsSessionType, SsObject, SsSet } from '../protocol';

export class Game extends Lifetime {
  readonly connection: SsConnection;
  readonly root: SsObject;
  readonly bodies: SetConduit<SsObject>;
  readonly spatials = new SpatialManager(this);
  /// The Starscape object of the currently controlled ship
  readonly currentShip = new LocalProperty<SsObject | null>(null);
  readonly animation;
  readonly framerate;

  constructor() {
    super();
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.root = this.connection.root;
    this.bodies = new SsSet(this.root.property('bodies', {arrayOf: SsObject}));
    this.animation = new AnimationTimer(this.root);
    this.framerate = new FramerateTracker(this.animation);
  }
}
