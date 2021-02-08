import React from 'react';

export default class ShipNameField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: '', promptForName: true};
    // TODO: subscribe to ship name
  }

  handleInput(evt) {
    let name = evt.target.value;
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
