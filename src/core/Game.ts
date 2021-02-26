import { LocalProperty } from './LocalProperty';
import { SsConnection, SsSessionType, SsObject } from '../protocol';

export interface Game {
  readonly connection: SsConnection;
  readonly god: SsObject;
  readonly currentShip: LocalProperty;
}

export class GameImpl {
  readonly connection: SsConnection;
  readonly god: SsObject;
  readonly currentShip: LocalProperty;

  constructor() {
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.god = this.connection.god;
    /// The Starscape object of the currently controlled ship
    this.currentShip = new LocalProperty(null);
  }
}
