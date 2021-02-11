import StarscapeConnection from '../lib/Starscape.js';
import {ValueElement} from '../lib/Element';

export default class State {
  constructor() {
    this.connection = new StarscapeConnection('websocket');
    this.god = this.connection.god;
    /// The Starscape object of the currently controlled ship
    this.currentShip = new ValueElement(null);
  }
}
