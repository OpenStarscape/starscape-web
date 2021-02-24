import {Vector3} from 'three';
import Lifetime from '../lib/Lifetime';
import { SsObject } from './SsObject';
import { SsSession } from  './SsSession';
import { SsRTCSession } from  './SsRTCSession';
import { SsWebSocketSession } from  './SsWebSocketSession';

export enum SsSessionType {
  WebRTC,
  WebSocket,
}

/// The toplevel object of a connection to an OpenStarscape server. sessionType should be either
/// 'webrtc' or 'websocket'. The .god object property is the entry point to accessing everything.
export class SsConnection {
  private readonly session: SsSession;
  private readonly lt = new Lifetime();
  private readonly objects = new Map();
  readonly god: SsObject;

  constructor(sessionType: SsSessionType) {
    if (sessionType === SsSessionType.WebRTC) {
      this.session = new SsRTCSession(this);
    } else if (sessionType === SsSessionType.WebSocket) {
      this.session = new SsWebSocketSession(this);
    } else {
      throw new Error('unknown session type "' + sessionType + '"');
    }
    this.god = this.getObj(1);
  }

  lifetime() {
    return this.lt;
  }

  /// Used internally to get or create an object with a given object ID.
  getObj(id: number) {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw new Error('ID ' + id + ' is not an int');
    }
    let obj = this.objects.get(id);
    if (obj === undefined) {
      obj = new SsObject(this, id);
      this.lt.add(obj);
      this.objects.set(id, obj);
    } else if (obj === null) {
      throw new Error('object ' + id + ' has already been destroyed');
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
      if (value.length === 1) {
        if (typeof value[0] === 'number') {
          return this.getObj(value[0]);
        } else if (Array.isArray(value[0])) {
          return value[0].map(item => this.decodeValue(item));
        } else {
          throw new Error('array-wrapped value is not a number or array');
        }
      } else if (value.length === 3) {
        return new Vector3(value[0], value[1], value[2]);
      } else {
        throw new Error('array-wrapped value has invalid length ' + value.length);
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
    } else if (value instanceof SsObject) {
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
      if (message.mtype === 'update' || message.mtype === 'value' || message.mtype === 'event') {
        if (typeof message.object !== 'number') {
          throw new Error('object not a number');
        }
        if (typeof message.property !== 'string') {
          throw new Error('property is a ' + typeof message.proprty + ' not a string');
        }
        let obj = this.getObj(message.object);
        let value = this.decodeValue(message.value);
        if (message.mtype === 'update') {
          obj.handleUpdate(message.property, value);
        } else if (message.mtype === 'value') {
          obj.handleGetReply(message.property, value);
        } else if (message.mtype === 'event') {
          obj.handleEvent(message.property, value);
        } else {
          throw new Error('should be unreachable');
        }
      } else if (message.mtype === 'error') {
        this.handleError('Error from OpenStarscape server:\n' + message.text);
      } else {
        throw new Error('unknown mtype ' + message.mtype);
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
        throw new Error('bundle ' + packet.toString() + ' has invalid type');
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
