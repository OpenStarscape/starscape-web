import { SsConnection } from '../protocol';
import {SsSessionType, SsObject} from '../protocol';
import {ValueElement} from '../lib/Element';

export default interface Game {
  readonly connection: SsConnection;
  readonly god: SsObject;
  readonly currentShip: ValueElement;
}

export class GameImpl {
  readonly connection: SsConnection;
  readonly god: SsObject;
  readonly currentShip: ValueElement;

  constructor() {
    this.connection = new SsConnection(SsSessionType.WebSocket);
    this.god = this.connection.god;
    /// The Starscape object of the currently controlled ship
    this.currentShip = new ValueElement(null);
  }
}
