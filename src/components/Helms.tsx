import React from 'react';
import State from '../lib/State.js';
import SpaceScene from '../graphics/SpaceScene.js';
import ShipNameField from './ShipNameField.js';
import ServerStats from './ServerStats.js';
import OrbitList from './OrbitList';

export default class Helms extends React.Component {
  private divRef = React.createRef<HTMLDivElement>();
  private gameState = new State();

  componentDidMount() {
    new SpaceScene(this.gameState, this.divRef.current);
    // TODO: dispose of SpaceScene on unmount
  }

  render() {
    return (
      <div>
        <div ref={this.divRef} style={{position: 'absolute', zIndex: 10}} />
        <div style={{position: 'absolute', zIndex: 100}}>
          <ShipNameField game={this.gameState} />
          <ServerStats game={this.gameState} />
          <OrbitList game={this.gameState} />
        </div>
      </div>
    )
  }
}
