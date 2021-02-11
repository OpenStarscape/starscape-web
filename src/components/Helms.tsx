import React from 'react';
import State from '../lib/State.js';
import SpaceScene from '../graphics/SpaceScene.js';
import ShipNameField from './ShipNameField.js';
import ServerStats from './ServerStats.js';
import OrbitList from './OrbitList';

export default class Helms extends React.Component<{game: State}, {}> {
  private divRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    new SpaceScene(this.props.game, this.divRef.current);
    // TODO: dispose of SpaceScene on unmount
  }

  render() {
    return (
      <div>
        <div ref={this.divRef} style={{position: 'absolute', zIndex: 10}} />
        <div style={{position: 'absolute', zIndex: 100}}>
          <ShipNameField game={this.props.game} />
          <ServerStats game={this.props.game} />
          <OrbitList game={this.props.game} />
        </div>
      </div>
    )
  }
}
