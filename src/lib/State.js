import StarscapeConnection from '../lib/Starscape';
import {StarscapeSessionType} from '../lib/Starscape';
import {ValueElement} from '../lib/Element';

export default class State {
  constructor() {
    this.connection = new StarscapeConnection(StarscapeSessionType.WebSocket);
    this.god = this.connection.god;
    /// The Starscape object of the currently controlled ship
    this.currentShip = new ValueElement(null);
  }
}
