import React from 'react';
import Helms from './Helms';
import Game from '../lib/Game';

/// All the pieces of an active game, holds a single active connection to a Starscape server.
export default class GameContainer extends React.Component<{}> {
  private game: Game | null = null;
  private message = '';

  constructor(props: {}) {
    super(props);
    try {
      this.game = new Game();
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
