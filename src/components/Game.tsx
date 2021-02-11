import React from 'react';
import Helms from './Helms';
import State from '../lib/State';

/// All the pieces of an active game, holds a single active connection to a Starscape server.
export default class Game extends React.Component {
  private game: State | null = null;
  private message = '';

  constructor(props: any) {
    super(props);
    try {
      this.game = new State();
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
