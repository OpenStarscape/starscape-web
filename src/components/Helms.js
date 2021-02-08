import React from 'react'
import State from '../lib/State.js';
import SpaceScene from '../graphics/SpaceScene.js';
import ShipNameField from './ShipNameField.js';

export default class Helms extends React.Component {
  constructor(props) {
    super(props)
    this.divRef = React.createRef();
    this.gameState = new State();
  }

  componentDidMount() {
    const scene = new SpaceScene(this.gameState, this.divRef.current);
  }

  render() {
    return (
      <div>
        <div ref={this.divRef} style={{position: 'absolute', zIndex: 10}} />
        <div style={{position: 'absolute', zIndex: 100}}>
          <ShipNameField game={this.gameState} />
        </div>
      </div>
    )
  }
}
