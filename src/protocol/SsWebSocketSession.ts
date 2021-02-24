import { SsSession } from './SsSession';
import { SsConnection } from './SsConnection';

function getUrl() {
  return (
    ((window.location.protocol === 'https:') ? 'wss://' : 'ws://') +
    window.location.host +
    '/websocket'
  );
}

/// Opens a WebSocket session with a Starscape server and exchanges packets.
export class SsWebSocketSession extends SsSession {
  private readonly socket = new WebSocket(getUrl());

  constructor(connection: SsConnection) {
    super(connection);
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = () => { this.onOpen(); };
    this.socket.onmessage = evt => { this.onPacket(evt.data); };
    this.socket.onclose = () => { this.onClose() };
    // There isn't much info here for some reason, some have suggested that capturing info in
    // onclose might have better results.
    this.socket.onerror = evt => { this.onError(evt.type); };
  }

  sendPacketInternal(data: Uint8Array) {
    this.socket.send(data);
  }

  /// Shut down this session
  dispose() {
    this.socket.close();
  }
}
