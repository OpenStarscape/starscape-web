import { Game } from '../game'
import { LifetimeComponent } from './LifetimeComponent'

type Props = {
  game: Game,
}

type State = {
  conn_count?: number,
  max_conn_count?: number,
  fps?: number | null,
}

export class GameStats extends LifetimeComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {}
  }

  componentDidMount() {
    this.props.game.god.property('conn_count', Number).subscribe(this, count => {
      this.setState({conn_count: count});
    });
    this.props.game.god.property('max_conn_count', Number).subscribe(this, count => {
      this.setState({max_conn_count: count});
    });
    this.props.game.fps.subscribe(this, fps => {
      this.setState({fps: fps});
    });
  }

  render() {
    if (
      this.state.conn_count === undefined ||
      this.state.max_conn_count === undefined ||
      this.state.fps === undefined
    ) {
      return null;
    } else {
      return (
        <p style={{color: 'white'}}>
          Connections: {this.state.conn_count}/{this.state.max_conn_count}
          <br />
          FPS: {this.state.fps ? this.state.fps.toFixed(2) : ' - '}
        </p>
      );
    }
  }
}
