import {Vector3} from 'three';
import {Subscriber, Element} from '../lib/Element.js';

class StarscapeRTCSession {
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
      // console.log('Queued packets:', this.queuedPackets);
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
      // console.log('sending packet:', packet);
      let array = this.encoder.encode(packet);
      this.channel.send(array);
    } else {
      // The connection is not yet open
      // console.log('queueing packet:', packet);
      this.queuedPackets.push(packet);
    }
  }

  close() {
    console.log('closing connection');
    this.channel.close();
  }
}

class GetSubscriber extends Subscriber {
  elementUpdate(value) {
    if (this.callback !== null) {
      this.callback(value);
    }
    this.callback = null;
    this.group.deleteSubscriber(this);
    this.element.deleteSubscriber(this);
  }

  isPending() {
    return this.callback !== null;
  }
}

export class StarscapeProperty extends Element {
  constructor(obj, name) {
    super();
    this.obj = obj;
    this.name = name;
    this.isSubscribed = false;
    this.hasPendingGet = false;
  }

  set(value) {
    this.obj.connection.setProperty(this.obj.id, this.name, value);
  }

  setter() {
    return value => { this.set(value); };
  }

  getThen(group, callback) {
    const subscriber = new GetSubscriber(this, group, callback);
    // Note that we call the super version, we don't want to call connection.subscribeTo()
    super.addSubscriber(subscriber);
    // May have already fired and cleaned itself up, in which case isPending() is false
    if (!this.hasPendingGet && subscriber.isPending()) {
      this.hasPendingGet = true;
      this.obj.connection.getProperty(this.obj.id, this.name);
    }
  }

  getter(group) {
    const subscriber = Subscriber(group, null);
    this.addSubscriber(subscriber);
    return () => {
      group.verifyAcrive();
      return this.cachedValue();
    };
  }

  cachedValue() {
    if (!this.isAlive()) {
      throw 'cachedValue() called after object destroyed';
    }
    return this.value;
  }

  addSubscriber(subscriber) {
    super.addSubscriber(subscriber);
    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.obj.connection.subscribeTo(this.obj.id, this.name);
    }
  }

  deleteSubscriber(subscriber) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size == 0 && this.isSubscribed) {
      this.isSubscribed = false;
      this.value = undefined;
      this.obj.connection.unsubscribeFrom(this.obj.id, this.name);
    }
  }

  handleUpdate(value) {
    if (this.isSubscribed) {
      this.value = value;
    }
    // get request subscribers need to be notified even when not subscribed
    this.sendUpdates(value);
  }

  handleGetReply(value) {
    this.hasPendingOneshot = false;
    this.handleUpdate(value);
  }

  handleObjectDestroyed() {
    this.obj = null;
    this.isSubscribed = false;
    this.hasPendingGet = false;
    this.notifyDestroued();
  }
}

export class StarscapeEvent extends Element {
  constructor(obj, name) {
    super();
    this.obj = obj;
    this.name = name;
    this.isSubscribed = false;
  }

  addSubscriber(subscriber) {
    super.addSubscriber(subscriber);
    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.obj.connection.subscribeTo(this.obj.id, this.name);
    }
  }

  deleteSubscriber(subscriber) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size == 0 && this.isSubscribed) {
      this.isSubscribed = false;
      this.obj.connection.unsubscribeFrom(this.obj.id, this.name);
    }
  }

  handleEvent(value) {
    this.sendUpdates(value);
  }
}

export class StarscapeAction extends Element {
  constructor(obj, name) {
    super();
    this.obj = obj;
    this.name = name;
  }

  fire(value) {
    if (!this.isAlive()) {
      throw 'fire() called after object destroyed';
    }
    this.obj.connection.fireAction(this.obj.id, this.name, value);
    this.sendUpdates(value);
  }

  firer() {
    return value => { this.fire(value) };
  }
}

export class StarscapeObject {
  constructor(connection, id) {
    this.connection = connection;
    this.id = id;
    this.members = new Map();
  }

  member(name, memberClass) {
    let member = this.members.get(name);
    if (!member) {
      member = new memberClass(this, name);
      this.members.set(name, member);
    } else if (!(member instanceof memberClass)) {
      throw (this.id + '.' + name +
        ' can not be created as a ' + memberClass.constructor.name +
        ' because it was already created as a ' + member.constructor.name);
    }
    return member;
  }

  property(name) {
    return this.member(name, StarscapeProperty);
  }

  action(name) {
    return this.member(name, StarscapeAction);
  }

  event(name) {
    return this.member(name, StarscapeEvent);
  }

  handleUpdate(name, value) {
    const member = this.members.get(name);
    if (member) {
      if (!(member instanceof StarscapeProperty)) {
        throw ('can not process update for ' + this.id + '.' + name +
          'because it is a ' + member.constructor.name);
      }
      member.handleUpdate(value);
    }
  }

  handleGetReply(name, value) {
    const member = this.members.get(name);
    if (member) {
      if (!(member instanceof StarscapeProperty)) {
        throw ('can not process get reply for ' + this.id + '.' + name +
          'because it is a ' + member.constructor.name);
      }
      member.handleGetReply(value);
    }
  }

  handleEvent(name, value) {
    const member = this.members.get(name);
    if (member) {
      if (!(member instanceof StarscapeEvent)) {
        throw ('can not process event for ' + this.id + '.' + name +
          'because it is a ' + member.constructor.name);
      }
      member.handleEvent(value);
    }
  }
}

export default class StarscapeConnection {
  constructor() {
    this.session = new StarscapeRTCSession((packet) => this.handlePacket(packet));
    this.objects = new Map();
    this.god = this.getObj(1);
  }

  getObj(id) {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw 'ID ' + id + ' is not an int';
    }
    let obj = this.objects.get(id);
    if (!obj) {
      obj = new StarscapeObject(this, id);
      this.objects.set(id, obj);
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

  encodeValue(value) {
    if (value instanceof Vector3) {
      return value.toArray();
    } else if (value instanceof StarscapeObject) {
      return [value.id];
    } else if (Array.isArray(value)) {
      return [value.map(i => this.encodeValue(i))];
    } else {
      return value;
    }
  }

  handleMessage(message) {
    try {
      if (message.mtype == 'update' || message.mtype == 'value' || message.mtype == 'event') {
        if (typeof message.object !== 'number') {
          throw 'object not a number';
        }
        if (typeof message.property !== 'string') {
          throw 'property is a ' + typeof message.proprty + ' not a string';
        }
        let obj = this.getObj(message.object);
        let value = this.resolveValue(message.value);
        if (message.mtype == 'update') {
          obj.handleUpdate(message.property, value);
        } else if (message.mtype == 'value') {
          obj.handleGetReply(message.property, value);
        } else if (message.mtype == 'event') {
          obj.handleEvent(message.property, value);
        } else {
          throw 'should be unreachable';
        }
      } else {
        throw 'unknown mtype ' + message.mtype;
      }
    }
    catch(err) {
      console.error('error handling message: ' + err + ' (message: ' + message + ')');
    }
  }

  handlePacket(packet) {
    // console.log('got packet', packet);
    try {
      let bundle = JSON.parse(packet);
      if (Array.isArray(bundle)) {
        for (let i = 0; i < bundle.length; i++) {
          this.handleMessage(bundle[i]);
        }
      } else if (typeof bundle === 'object') {
        this.handleMessage(bundle);
      } else {
        throw 'bundle ' + packet.toString() + ' has invalid type';
      }
    }
    catch(err) {
      console.error('error handling packet: ' + err + ' (packet: ' + packet + ')');
    }
  }

  setProperty(obj, prop, value) {
    value = this.encodeValue(value);
    let json = JSON.stringify({mtype: 'set', object: obj, property: prop, value: value}) + '\n';
    this.session.sendPacket(json);
  }

  fireAction(obj, prop, value) {
    // using the same protocol message as set is just a temporary hack, but it works
    this.setProperty(obj, prop, value);
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
