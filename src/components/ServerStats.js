import React from 'react'
import Lifetime from '../lib/Lifetime'

export default class ServerStats extends React.Component {
  constructor(props) {
    super(props);
    this.lt = new Lifetime();
    this.state = {}
  }

  componentDidMount() {
    this.props.game.god.property('conn_count').subscribe(this.lt, count => {
      this.setState({conn_count: count});
    });
    this.props.game.god.property('max_conn_count').subscribe(this.lt, count => {
      this.setState({max_conn_count: count});
    });
  }

  componentWillUnmount() {
    this.lt.dispose();
  }

  render() {
    if (this.state.conn_count === undefined || this.state.max_conn_count === undefined) {
      return null;
    } else {
      return (
        <p style={{color: 'white'}}>
          Connections {this.state.conn_count}/{this.state.max_conn_count}
        </p>
      );
    }
  }
}
