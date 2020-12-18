import {Vector3} from 'three';

class RTCSession {
  constructor(handlePacket) {
    this.connection = new RTCPeerConnection({
      iceServers: [{
        urls: ['stun:stun.l.google.com:19302']
      }]
    });

    this.channel = this.connection.createDataChannel('starscape-data', {
      ordered: false,
      maxRetransmits: 0
    });

    this.channel.binaryType = 'arraybuffer';
    this.encoder = new TextEncoder(); // utf-8 by defailt
    this.decoder = new TextDecoder(); // utf-8 by default
    this.isOpen = false;
    this.queuedPackets = []; // Used before the channel is open
    this.handlePacket = handlePacket;

    this.channel.onopen = () => {
      console.log('WebRTC channel opened');
      this.channel.onmessage = (evt) => {
        // let array = new Uint8Array(evt.data);
        // TODO: use decoder instead of .toString
        let str = evt.data.toString();
        this.handlePacket(str);
      };
      this.isOpen = true
      console.log('Queued packets:', this.queuedPackets);
      for (let i = 0; i < this.queuedPackets.length; i++) {
        this.sendPacket(this.queuedPackets[i])
      }
      this.queuedPackets = []
    };

    this.channel.onerror = (evt) => {
      let message = 'WebRTC channel error: ' + evt.message
      console.error(message);
      window.alert(message);
    };

    /*
    this.channel.onicecandidate = (evt) => {
      if (evt.candidate) {
        console.log("received ice candidate", evt.candidate);
      } else {
        console.log("all local candidates received");
      }
    };
    */

    this.connection.createOffer().then((offer) => {
      return this.connection.setLocalDescription(offer);
    }).then(() => {
      // vue.config.js should set up a proxy to redirect this to our Rust server
      let request = new XMLHttpRequest();
      request.open('POST', '/rtc');
      request.onload = () => {
        if (request.status == 200) {
          let response = JSON.parse(request.responseText);
          this.connection.setRemoteDescription(new RTCSessionDescription(response.answer)).then(() => {
            let candidate = new RTCIceCandidate(response.candidate);
            this.connection.addIceCandidate(candidate).then(() => {
              console.log('add ice candidate success');
            }).catch((err) => {
              console.log('error during "addIceCandidate":', err);
            });
          }).catch((e) => {
            console.log('error during "setRemoteDescription":', e);
          });
        }
      };
      request.send(this.connection.localDescription.sdp);
    }).catch((reason) => {
      console.log('error during "createOffer":', reason);
    });
  }

  maxPacketLen() {
    return 2020;
  }

  sendPacket(packet) {
    if (this.isOpen) {
      // The connection is open
      console.log('sending packet:', packet);
      let array = this.encoder.encode(packet);
      this.channel.send(array);
    } else {
      // The connection is not yet open
      console.log('sueueing packet:', packet);
      this.queuedPackets.push(packet);
    }
  }

  close() {
    console.log('closing connection');
    this.channel.close();
  }
}

class Obj {
  constructor(starscape, id) {
    this.starscape = starscape;
    this.id = id;
    this.oneshots = {}
    this.subscribers = {}
  }

  propertyUpdate(prop, value) {
    if (prop in this.oneshots) {
      this.oneshots[prop].forEach(handler => handler(value));
      delete this.oneshots[prop];
    }
    if (prop in this.subscribers) {
      this.subscribers[prop](value);
    }
  }

  set(prop, value) {
    this.starscape.setProperty(this.id, prop, value);
  }

  get(prop, handler) {
    if (prop in this.oneshots) {
      this.oneshots[prop].push(handler);
    } else {
      this.oneshots[prop] = [handler];
    }
    this.starscape.getProperty(this.id, prop);
  }

  subscribe(prop, handler) {
    // TODO: what happens if unsub + sub arrive out of order?
    // Overwrite any previous subscriber
    this.subscribers[prop] = handler;
    // This should probably be dropped if already subscribed, but we're unreliable so screw it
    this.starscape.subscribeTo(this.id, prop);
  }

  unsubscribe(prop) {
    delete this.subscribers[prop];
    this.starscape.unsubscribeFrom(this.id, prop);
  }
}

export default class Starscape {
  constructor() {
    this.session = new RTCSession((packet) => this.handlePacket(packet));
    this.god = new Obj(this, 1);
    this.objects = {1: this.god};
  }

  getObj(id) {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw 'ID ' + id + ' is not an int';
    }
    let obj;
    if (id in this.objects) {
      obj = this.objects[id];
    } else {
      obj = new Obj(this, id);
      this.objects[id] = obj;
    }
    return obj;
  }

  resolveValue(value) {
    if (Array.isArray(value)) {
      if (value.length == 1) {
        if (typeof value[0] === 'number') {
          return this.getObj(value[0]);
        } else if (Array.isArray(value[0])) {
          return value[0].map(item => this.resolveValue(item));
        } else {
          throw 'array-wrapped value is not a number or array';
        }
      } else if (value.length == 3) {
        return new Vector3(value[0], value[1], value[2]);
      }
    } else {
      return value;
    }
  }

  handlePacket(packet) {
    try {
      let message = JSON.parse(packet);
      // message.mtype instanceof String does not work!??
      if (typeof message.mtype !== 'string') {
        throw 'mtype is ' + typeof(message.mtype) + ' instead of string';
      }
      if (message.mtype == 'update' || message.mtype == 'value') {
        if (typeof message.object !== 'number') {
          throw 'object not a number';
        }
        if (typeof message.property !== 'string') {
          throw 'property is a ' + typeof message.proprty + ' not a string';
        }
        let obj = this.getObj(message.object);
        let value = this.resolveValue(message.value);
        obj.propertyUpdate(message.property, value);
      }
    }
    catch(err) {
      console.error('error handling packet: ' + err + ' (packet: ' + packet + ')');
    }
  }

  setProperty(obj, prop, value) {
    let json = JSON.stringify({mtype: 'set', object: obj, property: prop, value: value}) + '\n';
    this.session.sendPacket(json);
  }

  getProperty(obj, prop) {
    let json = JSON.stringify({mtype: 'get', object: obj, property: prop}) + '\n';
    this.session.sendPacket(json);
  }

  subscribeTo(obj, prop) {
    let json = JSON.stringify({mtype: 'subscribe', object: obj, property: prop}) + '\n';
    this.session.sendPacket(json);
  }

  unsubscribeFrom(obj, prop) {
    let json = JSON.stringify({mtype: 'unsubscribe', object: obj, property: prop}) + '\n';
    this.session.sendPacket(json);
  }
}
