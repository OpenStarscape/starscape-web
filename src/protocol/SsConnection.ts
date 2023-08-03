import { Vec3, Lifetime } from '../core';
import { SsObject } from './SsObject';
import { SsValue } from './SsValue';
import { SsRequest, SsRequestType } from './SsRequest';
import { SsSession } from  './SsSession';
import { SsRTCSession } from  './SsRTCSession';
import { SsWebSocketSession } from  './SsWebSocketSession';

export enum SsSessionType {
  WebRTC,
  WebSocket,
}

/// The toplevel object of a connection to an OpenStarscape server. sessionType should be either
/// 'webrtc' or 'websocket'. The .root object property is the entry point to accessing everything.
export class SsConnection extends Lifetime {
  private readonly session: SsSession;
  private readonly objects: Map<number, SsObject | null> = new Map();
  readonly root: SsObject;

  constructor(sessionType: SsSessionType) {
    super();
    if (sessionType === SsSessionType.WebRTC) {
      this.session = new SsRTCSession(this);
    } else if (sessionType === SsSessionType.WebSocket) {
      this.session = new SsWebSocketSession(this);
    } else {
      throw Error('unknown session type "' + sessionType + '"');
    }
    this.root = this.getObj(1);
    this.root.signal('error', String).subscribe(this.root, message => {
      console.error('server: ' + message);
    });
  }

  /// Used internally to get or create an object with a given object ID.
  getObj(id: number): SsObject {
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw Error('ID ' + id + ' is not an int');
    }
    let obj = this.objects.get(id);
    if (obj === undefined) {
      obj = this.addDependent(new SsObject(this, id));
      this.objects.set(id, obj);
    } else if (obj === null) {
      throw Error('object ' + id + ' has already been destroyed');
    }
    return obj;
  }

  handleError(message: string) {
    console.error(message);
    window.alert(message + '\n\nIf you continue to have problems, try refreshing');
  }

  /// Used internally when an object should be destroyed
  destroyObj(id: number) {
    const obj = this.objects.get(id);
    if (obj !== undefined && obj !== null) {
      obj.kill();
    }
    /// Set to null instead of removing so a new object can't be made with the same ID
    this.objects.set(id, null);
  }

  /// Turns a value decoded from JSON into one suitable to send to the rest of the app. In many
  /// cases this does nothing but in some some translation is required.
  decodeValue(value: any): SsValue {
    if (Array.isArray(value)) {
      if (value.length === 1) {
        if (typeof value[0] === 'number') {
          return this.getObj(value[0]);
        } else if (Array.isArray(value[0])) {
          return value[0].map(item => this.decodeValue(item));
        } else {
          throw Error('array-wrapped value is not a number or array');
        }
      } else if (value.length === 3) {
        if (typeof value[0] === 'number' &&
            typeof value[1] === 'number' &&
            typeof value[2] === 'number'
        ) {
          return new Vec3(value[0], value[1], value[2]);
        } else {
          throw Error('vector3 contains invalid value(s): ' + JSON.stringify(value));
        }
      } else {
        throw Error('array-wrapped value has invalid length ' + value.length);
      }
    } else if (value === null ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'string'
    ) {
      return value;
    } else {
      throw Error('invalid value: ' + value);
    }
  }

  /// Turns a value from the app into one ready to be converted to JSON. In many cases this does
  /// nothing but in some some translation is required.
  encodeValue(value: SsValue | undefined): any {
    if (value instanceof Vec3) {
      return value.toArray();
    } else if (value instanceof SsObject) {
      return [value.id];
    } else if (Array.isArray(value)) {
      return [value.map(i => this.encodeValue(i))];
    } else if (value === undefined) {
      throw Error("value is undefined");
    } else if (value !== null && typeof value === 'object') {
      const result: any = {};
      for (const k of Object.keys(value)) {
        if (value[k] !== undefined) {
          result[k] = this.encodeValue(value[k] as any);
        }
      }
      return result;
    } else {
      return value;
    }
  }

  /// Handle a single protocol message, deserialized from JSON
  handleMessage(message: any[]) {
    if (!message.length || typeof message[0] !== 'number') {
      throw Error('invalid message: ' + message.toString());
    }
    const opcode = message[0];
    if (opcode === 0) {
      if (message.length !== 2 || typeof message[1] !== 'string') {
        throw Error('invalid fatal error message: ' + message.toString());
      }
      this.handleError('Error from OpenStarscape server:\n' + message[1]);
    } else if (opcode === 1) {
      if (message.length !== 2 || typeof message[1] !== 'number') {
        throw Error('invalid object destroyed message: ' + message.toString());
      }
      this.destroyObj(message[1]);
    } else if (message.length === 4) {
      if (message.length !== 4 ||
          typeof message[1] !== 'number' ||
          typeof message[2] !== 'string'
      ) {
        throw Error('invalid object member message: ' + message.toString());
      }
      const obj = this.getObj(message[1]);
      const member = message[2];
      const value = this.decodeValue(message[3]);
      switch (opcode) {
        case 2: obj.handleGetReply(member, value); return;
        case 3: obj.handleUpdate(member, value); return;
        case 4: obj.handleSignal(member, value); return;
      }
    } else {
      throw Error('message has invalid length: ' + message.toString());
    }
  }

  /// Handle a packet string, which could contain one or more message.
  handlePacket(packet: string) {
    //console.log('  > ', packet);
    //try {
      let bundle = JSON.parse(packet);
      if (Array.isArray(bundle)) {
        this.handleMessage(bundle);
      } else {
        throw Error('invalid packet: ' + packet);
      }
    //}
    //catch(err) {
    //  console.error('error handling packet: ' + err + ' (packet: ' + packet + ')');
    //  console.trace();
    //}
  }

  /// Low level function used internally, use the functions on properties, signals and actions instead
  makeRequest(rq: SsRequest) {
    let json;
    if (rq.method === SsRequestType.Set) {
      const value = this.encodeValue(rq.value);
      json = [9, rq.objId, rq.member, value];
    } else if (rq.method === SsRequestType.Get) {
      json = [8, rq.objId, rq.member];
    } else if (rq.method === SsRequestType.Fire) {
      const value = this.encodeValue(rq.value);
      json = [14, rq.objId, rq.member, value];
    } else if (rq.method === SsRequestType.Subscribe) {
      json = [10, rq.objId, rq.member];
    } else if (rq.method === SsRequestType.Unsubscribe) {
      json = [11, rq.objId, rq.member];
    } else {
      throw Error('Request has invalid request type: ' + JSON.stringify(rq));
    }
    const encoded = JSON.stringify(json) + '\n';
    this.session.sendPacket(encoded);
    //console.log(' <  ', encoded);
  }
}
