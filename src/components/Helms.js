import React from 'react'
import State from '../lib/State.js';
import SpaceScene from '../graphics/SpaceScene.js';

export default class Helms extends React.Component {
  constructor() {
    super()
    this.divRef = React.createRef();
  }

  render() {
    return (
      <div ref={this.divRef} />
    )
  }

  componentDidMount() {
    this.gameState = new State();
    const scene = new SpaceScene(this.gameState, this.divRef.current);
  }
}
