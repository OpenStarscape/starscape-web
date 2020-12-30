import StarscapeConnection from '../lib/Starscape.js';
import {ValueElement} from '../lib/Element.js';

export default class State {
  constructor() {
    this.connection = new StarscapeConnection();
    /// The Starscape object of the currently controlled ship
    this.currentShip = new ValueElement(null);
  }
}
