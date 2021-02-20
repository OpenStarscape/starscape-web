import StarscapeConnection from '../lib/Starscape';
import {StarscapeSessionType, StarscapeObject} from '../lib/Starscape';
import {ValueElement} from '../lib/Element';

export default interface Game {
  readonly connection: StarscapeConnection;
  readonly god: StarscapeObject;
  readonly currentShip: ValueElement;
}

export class GameImpl {
  readonly connection: StarscapeConnection;
  readonly god: StarscapeObject;
  readonly currentShip: ValueElement;

  constructor() {
    this.connection = new StarscapeConnection(StarscapeSessionType.WebSocket);
    this.god = this.connection.god;
    /// The Starscape object of the currently controlled ship
    this.currentShip = new ValueElement(null);
  }
}
