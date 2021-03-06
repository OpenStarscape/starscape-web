import React from 'react';
import { Game, GameImpl } from '../game';
import Helms from './Helms';

/// All the pieces of an active game, holds a single active connection to a Starscape server.
export default class GameContainer extends React.Component<{}> {
  private game: Game | null = null;
  private message = '';

  constructor(props: {}) {
    super(props);
    try {
      this.game = new GameImpl();
    } catch(err) {
      this.message = 'Error initializing session: ' + err.toString();
    }
  }

  render() {
    if (this.game) {
      return (
        <Helms game={this.game} />
      );
    } else {
      return (
        <p>{this.message}</p>
      );
    }
  }
}
