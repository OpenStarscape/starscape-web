import { SsSession } from './SsSession';
import { SsConnection } from './SsConnection';

/// Opens a WebRTC session with a Starscape server and exchanges packets.
export class SsRTCSession extends SsSession {
  private readonly rtc: RTCPeerConnection;
  private readonly channel: RTCDataChannel;

  constructor(connection: SsConnection) {
    super(connection);
    this.rtc = new RTCPeerConnection({
      iceServers: [{
        urls: ['stun:stun.l.google.com:19302']
      }]
    });

    this.channel = this.rtc.createDataChannel('starscape-data', {
      ordered: false,
      maxRetransmits: 0
    });

    this.channel.binaryType = 'arraybuffer';

    this.channel.onopen = () => { this.onOpen(); };
    this.channel.onmessage = evt => { this.onPacket(evt.data); };
    this.channel.onclose = () => { this.onClose(); };
    this.channel.onerror = evt => { this.onError(evt.error.toString()); };

    this.rtc.createOffer().then((offer) => {
      return this.rtc.setLocalDescription(offer);
    }).then(() => {
      // vue.config.js should set up a proxy to redirect this to our Rust server
      let request = new XMLHttpRequest();
      request.open('POST', '/rtc');
      request.onload = () => {
        if (request.status === 200) {
          let response = JSON.parse(request.responseText);
          this.rtc.setRemoteDescription(new RTCSessionDescription(response.answer)).then(() => {
            let candidate = new RTCIceCandidate(response.candidate);
            this.rtc.addIceCandidate(candidate).then(() => {
              console.log('add ice candidate success');
            }).catch((err) => {
              console.log('error during "addIceCandidate":', err);
            });
          }).catch((e) => {
            console.log('error during "setRemoteDescription":', e);
          });
        }
      };
      request.send(this.rtc.localDescription!.sdp);
    }).catch((reason) => {
      console.log('error during "createOffer":', reason);
    });
  }

  /// The maximum safe packet size. Note this was tests sending packets from the server to a client
  /// running on Google Chrome (which was lower than Firefox). There might be a smarter way to
  /// decide this. See the comment in webrtc_session.rs in the server for more details.
  maxPacketLen() {
    return 2020;
  }

  sendPacketInternal(data: Uint8Array) {
    this.channel.send(data);
  }

  /// Shut down this session
  dispose() {
    this.channel.close();
  }
}
