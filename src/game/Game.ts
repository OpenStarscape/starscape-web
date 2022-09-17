import { LocalProperty, Lifetime, SetConduit, FilterSetConduit } from '../core';
import { FramerateTracker } from './FramerateTracker';
import { AnimationTimer } from './AnimationTimer';
import { Body } from './Body';
import { SsConnection, SsSessionType, SsObject, SsSet } from '../protocol';

export class Game extends Lifetime {
  readonly connection: SsConnection;
  readonly root: SsObject;
  readonly bodies: SetConduit<SsObject>;
  /// The Starscape object of the currently controlled ship
  readonly currentShip = new LocalProperty<Body | null>(null);
  readonly notCurrentShipBodies;
  readonly animation;
  readonly framerate;
  private readonly bodyMap = new Map<SsObject, Body>();

  constructor() {
    super();
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.root = this.connection.root;
    this.bodies = new SsSet(this.root.property('bodies', {arrayOf: SsObject}));
    this.notCurrentShipBodies = new FilterSetConduit(this.bodies, (lt, body) => {
      const prop = new LocalProperty(true);
      this.currentShip.subscribe(lt, current => {
        prop.set(current?.obj !== body);
      });
      return prop;
    })
    this.animation = new AnimationTimer(this.root);
    this.framerate = new FramerateTracker(this.animation);
  }

  getBody(obj: SsObject): Body {
    let body = this.bodyMap.get(obj);
    if (body) {
      return body;
    } else {
      body = new Body(this, obj);
      this.bodyMap.set(obj, body);
      return body;
    }
  }
}
