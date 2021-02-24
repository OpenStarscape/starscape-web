import React from 'react';
import { Game } from '../core'

type Props = {
  game: Game
}

type State = {
  name: string | null,
  promptForName: boolean,
  value?: string
}

export default class ShipNameField extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {name: null, promptForName: true};
    // TODO: subscribe to ship name
  }

  handleInput(evt: React.ChangeEvent<HTMLInputElement>) {
    let name: string | null = evt.target.value;
    if (!name) {
      name = null;
    }
    this.setState({name: name, promptForName: false});
    const ship = this.props.game.currentShip.get();
    if (ship) {
      ship.property('name').set(name);
    }
  }

  render() {
    const promptStyle = {fontSize: 'x-large', color: 'yellow'};
    return (
      <div>
        <input value={this.state.value} onChange={evt => this.handleInput(evt)}/>
        {this.state.promptForName &&
          <p style={promptStyle}>⮤ give your ship a name</p>
        }
      </div>
    );
  }
}
