import React from 'react';
import * as THREE from "three";
import Game from '../lib/Game';
import StarscapeSet from '../lib/StarscapeSet';
import { SsObject } from '../protocol';
import Lifetime from '../lib/Lifetime';

type ButtonProps = {
  obj: SsObject,
  lt: Lifetime,
  handleSelected: (button: OrbitButton) => void
}

class OrbitButton extends React.Component<ButtonProps, {}> {
  state = {text: ''}

  showSelected() {
    this.setState({selected: true});
    //this.elem.style.fontWeight = 'bold';
  }

  showUnselected() {
    this.setState({selected: false});
  }

  componentDidMount() {
    this.props.obj.property('name').subscribe(this.props.lt, (name: string) => {
      this.setState({text: 'Orbit ' + name});
    })
  }

  onClick() {
    this.props.handleSelected(this);
    this.showSelected();
  }

  render() {
    if (this.state.text === undefined) {
      return null;
    } else {
      return (
        <button style={{display: 'block'}} onClick={() => this.onClick()}>{this.state.text}</button>
      );
    }
  }
}

type ListProps = {
  game: Game
}

type ListState = {
  buttons: JSX.Element[]
}

export default class OrbitList extends React.Component<ListProps, ListState> {
  private lt = new Lifetime();
  private selectedButton: OrbitButton | null = null;

  constructor(props: ListProps) {
    super(props);
    this.state = {buttons: []};
    //this.selectedButton = new Button(this, lifetime, 'Manual Control', () => callback(null));
    //this.selectedButton.setText('Manual Control');
    //this.selectedButton.showSelected();
  }

  orbit(targetObj: SsObject | null) {
    const ship = this.props.game.currentShip.get();
    if (targetObj === ship) {
      targetObj = null;
    }
    if (ship && targetObj === null) {
      ship.property('ap_scheme').set('off');
      ship.property('accel').set(new THREE.Vector3(0, 0, 0));
      //this.manualControls = true;
    } else if (ship && targetObj) {
      ship.property('ap_scheme').set('orbit');
      ship.property('ap_target').set(targetObj);
      ship.property('ap_distance').set(null);
      //this.manualControls = false;
    } else {
      console.error('Could not set up autopilot');
    }
  }

  addButton(button: JSX.Element) {
    this.setState((state: ListState, _props: ListProps) => {
      const buttons = state.buttons.slice(); // clone array so we don't change state.buttons
      buttons.push(button);
      return {buttons: buttons};
    });
  }

  deleteButton(button: JSX.Element) {
    this.setState((state: ListState, _props: ListProps) => {
      const buttons = state.buttons.slice(); // clone array so we don't change state.buttons
      const i = buttons.indexOf(button);
      if (i > -1) {
        buttons.splice(i, 1);
      }
      return {buttons: buttons};
    });
  }

  componentDidMount() {
    new StarscapeSet(this.props.game.god.property('bodies'), this.lt, (itemLt: Lifetime, obj: SsObject) => {
      const handleSelected = (button: OrbitButton) => {
        if (this.selectedButton) {
          this.selectedButton.showUnselected();
        }
        this.selectedButton = button;
        this.orbit(obj);
      };
      const button = (
        <OrbitButton obj={obj} lt={itemLt} handleSelected={handleSelected} />
      );
      this.addButton(button);
      // When body is destroyed, remove its button
      itemLt.addCallback(() => {
        this.deleteButton(button);
      });
    });
  }

  componentWillUnmount() {
    this.lt.dispose();
    this.setState({buttons: []});
  }

  render() {
    return (
      <div>
        {this.state.buttons}
      </div>
    );
  }
}
