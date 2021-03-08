import { LocalProperty } from '../core';
import { FramerateReporter } from './FramerateTracker';
import { SsConnection, SsSessionType, SsObject } from '../protocol';

export interface Game {
  readonly connection: SsConnection;
  readonly god: SsObject;
  readonly currentShip: LocalProperty<SsObject | null>;
  readonly fps: FramerateReporter;
}

export class GameImpl {
  readonly connection: SsConnection;
  readonly god: SsObject;
  /// The Starscape object of the currently controlled ship
  readonly currentShip = new LocalProperty<SsObject | null>(null);
  readonly fps = new FramerateReporter();

  constructor() {
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.god = this.connection.god;
  }
}
