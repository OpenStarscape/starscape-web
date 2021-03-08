import React from 'react';
import { Game } from '../game';
import { LifetimeComponent } from './LifetimeComponent';
import SpaceScene from '../graphics/SpaceScene';
import ShipNameField from './ShipNameField';
import { GameStats } from './GameStats';
import OrbitList from './OrbitList';

export default class Helms extends LifetimeComponent<{game: Game}, {}> {
  private divRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.add(new SpaceScene(this.props.game, this.divRef.current!));
  }

  render() {
    return (
      <div>
        <div ref={this.divRef} style={{position: 'absolute', zIndex: 10}} />
        <div style={{position: 'absolute', zIndex: 100}}>
          <ShipNameField game={this.props.game} />
          <GameStats game={this.props.game} />
          <OrbitList game={this.props.game} />
        </div>
      </div>
    );
  }
}
