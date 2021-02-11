import React from 'react';
import Game from '../lib/Game';
import SpaceScene from '../graphics/SpaceScene.js';
import ShipNameField from './ShipNameField';
import ServerStats from './ServerStats';
import OrbitList from './OrbitList';

export default class Helms extends React.Component<{game: Game}, {}> {
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
