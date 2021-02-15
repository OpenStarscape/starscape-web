import {Vector3} from 'three';
import {Subscriber, Element, valuesEqual} from '../lib/Element';
import Lifetime from "../lib/Lifetime";

abstract class StarscapeSession {
  private readonly encoder = new TextEncoder(); // utf-8 by defailt
  private readonly decoder = new TextDecoder(); // utf-8 by default
  private isOpen = false;
  private queuedPackets: string[] = [];

  constructor(
    private readonly connection: StarscapeConnection
  ) {}

  onOpen() {
    console.log(this.constructor.name + ' opened');
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
    console.log(this.constructor.name + ' closed');
  }

  onError(message: string) {
    this.connection.handleError(this.constructor.name + ' error: ' + message);
  }

  maxPacketLen() {
    return Infinity;
  }

  abstract sendPacketInternal(_data: Uint8Array): void;

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

/// Opens a WebRTC session with a Starscape server and exchanges packets.
class StarscapeRTCSession extends StarscapeSession {
  private readonly rtc: RTCPeerConnection;
  private readonly channel: RTCDataChannel;

  constructor(connection: StarscapeConnection) {
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
        if (request.status == 200) {
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

function getUrl() {
  return (
    ((window.location.protocol === "https:") ? "wss://" : "ws://") +
    window.location.host +
    "/websocket"
  );
}

/// Opens a WebRTC session with a Starscape server and exchanges packets.
class StarscapeWebSocketSession extends StarscapeSession {
  private readonly socket = new WebSocket(getUrl());

  constructor(connection: StarscapeConnection) {
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

/// A generic element for a Starscape object member (property/action/event). Should not be added
/// to any lifetime except that of it's objects.
export class StarscapeElement extends Element {
  readonly obj: StarscapeObject;
  readonly name: string;

  constructor(obj: StarscapeObject, name: string) {
    super();
    this.obj = obj;
    this.name = name;
  }

  lifetime() {
    return this.obj.lt;
  }

  /// Called by this property's object when the object is destroyed.
  dispose() {
    if (this.lifetime().isAlive()) {
      throw ('Element ' + this.obj + '.' + this.name + ' disposed before object\'s lifetime. ' +
        ' this indicates it was added to another lifetime or disposed manually, ' +
        ' neither of which should happen.');
    }
    super.dispose();
  }
}

/// A specialized subscriber used for receiving property get requests. Unlike a normal subscriber,
/// it's only supposed to be notified once and so removes itself from the element and lifetime.
class GetSubscriber extends Subscriber {
  elementUpdate(value: any) {
    super.elementUpdate(value);
    this.dispose();
  }

  isPending() {
    return this.callback !== null;
  }
}

/// The element type used for properties exposed by the server. Is created and returned by
/// StarscapeObject.property()
export class StarscapeProperty extends StarscapeElement {
  private isSubscribed = false;
  private hasPendingGet = false;

  /// Sends a set request to the server. The value is only updates and subscribers are only notified
  /// if and when the server responds to the request.
  set(value: any) {
    if (!valuesEqual(value, this.value)) {
      this.obj.connection.setProperty(this.obj.id, this.name, value);
      this.handleUpdate(value);
    }
  }

  /// If the current value is not known (.cachedValue() == undefined) sends a get request, and
  /// invokes the given callback when it's completed. If the current value is known no request is
  /// made and the callback is called immediately. If the object or lifetime die before the request
  /// completes, the callback may never be called.
  getThen(lifetime: Lifetime, callback: (value: any) => void) {
    const subscriber = new GetSubscriber(this, lifetime, callback);
    // Note that we call the super version, we don't want to call connection.subscribeTo()
    super.addSubscriber(subscriber);
    // May have already fired and cleaned itself up, in which case isPending() is false
    if (!this.hasPendingGet && subscriber.isPending()) {
      this.hasPendingGet = true;
      this.obj.connection.getProperty(this.obj.id, this.name);
    }
  }

  /// Returns a callable which returns the current value. To make sure values are available, this
  /// subscribes to the property and stays subscribed as long as the given lifetime lives. Note that
  /// if there were no previous subscribers the returned getter will return undefined until the
  /// initial request completes.
  getter(lifetime: Lifetime) {
    const subscriber = new Subscriber(this, lifetime, null);
    this.addSubscriber(subscriber);
    return () => {
      lifetime.verifyAlive();
      return this.cachedValue();
    };
  }

  /// Returns the current cached value, or undefined if there is none. Will always return undefined
  /// when there are no subscribers. WHen the first subscriber is added returns undefined until
  /// the initial request completes. Using a getter function returned by .getter() is recommended
  /// over calling this directly since that ensures we are subscribed.
  cachedValue() {
    if (!this.isAlive()) {
      throw 'cachedValue() called after object destroyed';
    }
    return this.value;
  }

  /// Overrides parent method, generally not called externally.
  addSubscriber(subscriber: Subscriber) {
    super.addSubscriber(subscriber);
    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.obj.connection.subscribeTo(this.obj.id, this.name);
    }
  }

  /// Overrides parent method, generally not called externally.
  deleteSubscriber(subscriber: Subscriber) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size == 0 && this.isSubscribed) {
      this.isSubscribed = false;
      this.value = undefined;
      this.obj.connection.unsubscribeFrom(this.obj.id, this.name);
    }
  }

  /// Called by this property's object when the value gets an update.
  handleUpdate(value: any) {
    if (this.isSubscribed) {
      this.value = value;
    }
    // get request subscribers need to be notified even when not subscribed
    this.sendUpdates(value);
  }

  /// Called by this property's object when a get request is responded to.
  handleGetReply(value: any) {
    this.hasPendingGet = false;
    this.handleUpdate(value);
  }

  /// Called by this property's object when the object is destroyed.
  dispose() {
    this.isSubscribed = false;
    this.hasPendingGet = false;
    super.dispose();
  }
}

/// An event sent from the server to us. It can be subscribed to but not fired by us. Is created and
/// returned by StarscapeObject.event()
export class StarscapeEvent extends StarscapeElement {
  private isSubscribed = false;

  /// Overrides parent method, generally not called externally.
  addSubscriber(subscriber: Subscriber) {
    super.addSubscriber(subscriber);
    if (!this.isSubscribed) {
      this.isSubscribed = true;
      this.obj.connection.subscribeTo(this.obj.id, this.name);
    }
  }

  /// Overrides parent method, generally not called externally.
  deleteSubscriber(subscriber: Subscriber) {
    super.deleteSubscriber(subscriber);
    if (this.subscribers.size == 0 && this.isSubscribed) {
      this.isSubscribed = false;
      this.obj.connection.unsubscribeFrom(this.obj.id, this.name);
    }
  }

  /// Called by the event's object when the server sends an event.
  handleEvent(value: any) {
    this.sendUpdates(value);
  }

  /// Called by this property's object when the object is destroyed.
  dispose() {
    this.isSubscribed = false;
    super.dispose();
  }
}

/// An action we can send to the server. We can also subscribe to it locally. Is created and
/// returned by StarscapeObject.action().
export class StarscapeAction extends StarscapeElement {
  /// Fire the action, which results in a server request and local subscribers being notified.
  fire(value: any) {
    if (!this.isAlive()) {
      throw 'fire() called after object destroyed';
    }
    this.obj.connection.fireAction(this.obj.id, this.name, value);
    this.sendUpdates(value);
  }
}

/// A handle to an object on the server. Is automatically created by the connection.
export class StarscapeObject {
  readonly lt = new Lifetime();
  private members = new Map<string, any>();

  constructor(
    readonly connection: StarscapeConnection,
    readonly id: number
  ) {
    connection.lifetime().add(this.lt);
  }

  /// Object must have a property with the given name. This is not automatically checked.
  property(name: string) {
    return this.member(name, StarscapeProperty) as StarscapeProperty;
  }

  /// Object must have an action with the given name. This is not automatically checked.
  action(name: string) {
    return this.member(name, StarscapeAction) as StarscapeAction;
  }

  /// Object must have an event with the given name. This is not automatically checked.
  event(name: string) {
    return this.member(name, StarscapeEvent) as StarscapeEvent;
  }

  /// Used internally, Get or create a property, action or event
  member(name: string, memberClass: any): any {
    if (!this.lt.isAlive()) {
      throw (this.id + '.' + name +
        ' can not be created since the object has been destroyed');
    }
    let member = this.members.get(name);
    if (!member) {
      member = new memberClass(this, name);
      this.lt.add(member);
      this.members.set(name, member);
    } else if (!(member instanceof memberClass)) {
      throw (this.id + '.' + name +
        ' can not be created as a ' + memberClass.constructor.name +
        ' because it was already created as a ' + member.constructor.name);
    }
    return member;
  }

  /// Called by the connection.
  handleUpdate(name: string, value: any) {
    const member = this.member(name, StarscapeProperty);
    member.handleUpdate(value);
  }

  /// Called by the connection.
  handleGetReply(name: string, value: any) {
    const member = this.member(name, StarscapeProperty);
    member.handleGetReply(value);
  }

  /// Called by the connection.
  handleEvent(name: string, value: any) {
    const member = this.member(name, StarscapeEvent);
    member.handleEvent(value);
  }

  dispose() {
    this.members.clear();
    this.lt.dispose();
  }
}

export enum StarscapeSessionType {
  WebRTC,
  WebSocket,
}

/// The toplevel object of a connection to an OpenStarscape server. sessionType should be either
/// 'webrtc' or 'websocket'. The .god object property is the entry point to accessing everything.
export default class StarscapeConnection {
  private readonly session: StarscapeSession;
  private readonly lt = new Lifetime();
  private readonly objects = new Map();
  readonly god: StarscapeObject;

  constructor(sessionType: StarscapeSessionType) {
    if (sessionType == StarscapeSessionType.WebRTC) {
      this.session = new StarscapeRTCSession(this);
    } else if (sessionType == StarscapeSessionType.WebSocket) {
      this.session = new StarscapeWebSocketSession(this);
    } else {
      throw 'unknown session type "' + sessionType + '"';
    }
    this.god = this.getObj(1);
  }

  lifetime() {
    return this.lt;
  }

  /// Used internally to get or create an object with a given object ID.
  getObj(id: number) {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw 'ID ' + id + ' is not an int';
    }
    let obj = this.objects.get(id);
    if (obj === undefined) {
      obj = new StarscapeObject(this, id);
      this.lt.add(obj);
      this.objects.set(id, obj);
    } else if (obj === null) {
      throw 'object ' + id + ' has already been destroyed';
    }
    return obj;
  }

  handleError(message: string) {
    console.error(message);
    window.alert(message + '\n\nIf you continue to have problems, try refreshing');
  }

  /// Used internally when an object should be destroyed (not yet implemented)
  destroyObj(id: number) {
    const obj = this.objects.get(id);
    if (obj) {
      this.lt.disposeOf(obj);
    }
    /// Set to null instead of removing so a new object can't be made with the same ID
    this.objects.set(id, null);
  }

  /// Turns a value decoded from JSON into one suitable to send to the rest of the app. In many
  /// cases this does nothing but in some some translation is required.
  decodeValue(value: any): any {
    if (Array.isArray(value)) {
      if (value.length == 1) {
        if (typeof value[0] === 'number') {
          return this.getObj(value[0]);
        } else if (Array.isArray(value[0])) {
          return value[0].map(item => this.decodeValue(item));
        } else {
          throw 'array-wrapped value is not a number or array';
        }
      } else if (value.length == 3) {
        return new Vector3(value[0], value[1], value[2]);
      } else {
        throw 'array-wrapped value has invalid length ' + value.length;
      }
    } else {
      return value;
    }
  }

  /// Turns a value from the app into one ready to be converted to JSON. In many cases this does
  /// nothing but in some some translation is required.
  encodeValue(value: any): any {
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

  /// Handle a single protocol message, deserialized from JSON
  handleMessage(message: any) {
    //try {
      if (message.mtype == 'update' || message.mtype == 'value' || message.mtype == 'event') {
        if (typeof message.object !== 'number') {
          throw 'object not a number';
        }
        if (typeof message.property !== 'string') {
          throw 'property is a ' + typeof message.proprty + ' not a string';
        }
        let obj = this.getObj(message.object);
        let value = this.decodeValue(message.value);
        if (message.mtype == 'update') {
          obj.handleUpdate(message.property, value);
        } else if (message.mtype == 'value') {
          obj.handleGetReply(message.property, value);
        } else if (message.mtype == 'event') {
          obj.handleEvent(message.property, value);
        } else {
          throw 'should be unreachable';
        }
      } else if (message.mtype == 'error') {
        this.handleError('Error from OpenStarscape server:\n' + message.text);
      } else {
        throw 'unknown mtype ' + message.mtype;
      }
    //}
    //catch(err) {
    //  console.error('error handling message: ' + err + ' (message: ' + message + ')');
    //  console.trace();
    //}
  }

  /// Handle a packet string, which could contain one or more message.
  handlePacket(packet: string) {
    //console.log('got packet', packet);
    //try {
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
    //}
    //catch(err) {
    //  console.error('error handling packet: ' + err + ' (packet: ' + packet + ')');
    //  console.trace();
    //}
  }

  /// Low level, do not call directly. Use obj.property().set() instead.
  setProperty(obj_id: number, prop: string, value: any) {
    value = this.encodeValue(value);
    let json = JSON.stringify({mtype: 'set', object: obj_id, property: prop, value: value}) + '\n';
    this.session.sendPacket(json);
  }

  /// Low level, do not call directly. Use obj.action().fire() instead.
  fireAction(obj_id: number, prop: string, value: any) {
    // using the same protocol message as set is just a temporary hack, but it works
    this.setProperty(obj_id, prop, value);
  }

  /// Low level, do not call directly. Use obj.property().getThen() instead.
  getProperty(obj_id: number, prop: string) {
    let json = JSON.stringify({mtype: 'get', object: obj_id, property: prop}) + '\n';
    this.session.sendPacket(json);
  }

  /// Low level, do not call directly. Use obj.property().subscribe() instead.
  subscribeTo(obj_id: number, prop: string) {
    let json = JSON.stringify({mtype: 'subscribe', object: obj_id, property: prop}) + '\n';
    this.session.sendPacket(json);
  }

  /// Low level, do not call directly. Is called automatically when required (assuming you dispose
  /// of your lifetimes when needed)
  unsubscribeFrom(obj_id: number, prop: string) {
    let json = JSON.stringify({mtype: 'unsubscribe', object: obj_id, property: prop}) + '\n';
    this.session.sendPacket(json);
  }

  dispose() {
    this.lt.dispose();
  }
}