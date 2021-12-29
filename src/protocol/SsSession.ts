import { SsConnection } from './SsConnection'

export abstract class SsSession {
  private readonly encoder = new TextEncoder(); // utf-8 by defailt
  private readonly decoder = new TextDecoder(); // utf-8 by default
  private isOpen = false;
  private queuedPackets: string[] = [];

  constructor(
    private readonly connection: SsConnection
  ) {}

  onOpen() {
    console.log(this.sessionTypeName() + ' opened');
    this.isOpen = true
    // console.log('Queued packets:', this.queuedPackets);
    for (let i = 0; i < this.queuedPackets.length; i++) {
      this.sendPacket(this.queuedPackets[i])
    }
    this.queuedPackets = []
  }

  onPacket(packet: Uint8Array) {
    //console.log('got packet', packet, typeof packet);
    const str = this.decoder.decode(packet);
    this.connection.handlePacket(str);
  }

  onClose() {
    console.log(this.sessionTypeName() + ' closed');
  }

  onError(message: string) {
    this.connection.handleError(this.sessionTypeName() + ' error: ' + message);
  }

  maxPacketLen() {
    return Infinity;
  }

  abstract sendPacketInternal(_data: Uint8Array): void;
  abstract sessionTypeName(): string;

  /// Send a packet containing the given string to the server
  sendPacket(packet: string) {
    if (this.isOpen) {
      // The connection is open
      // console.log('sending packet:', packet);
      let array = this.encoder.encode(packet);
      this.sendPacketInternal(array);
    } else {
      // The connection is not yet open
      // console.log('queueing packet:', packet);
      this.queuedPackets.push(packet);
    }
  }
}
