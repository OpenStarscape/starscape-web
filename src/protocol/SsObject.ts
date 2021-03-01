import { Lifetime, Conduit, RuntimeType, RealTypeOf, runtimeTypeEquals, runtimeTypeName, indirectRuntimeType} from '../core';
import { SsConnection } from './SsConnection';
import { SsProperty } from './SsProperty'
import { SsAction } from './SsAction'
import { SsSignal } from './SsSignal'
import { SsRequest } from './SsRequest'
import { SsValue } from './SsValue'

type Member = (SsProperty | SsAction<any> | SsSignal<any>) & Conduit<any>;
type MemberConstructor<T extends Member> = new (...args: any[]) => T

/// A handle to an object on the server. Is automatically created by the connection.
export class SsObject {
  readonly lt = new Lifetime();
  private members = new Map<string, Member>();

  constructor(
    readonly connection: SsConnection,
    readonly id: number
  ) {
    connection.lifetime().add(this.lt);
  }

  /// Object must have a property with the given name. This is not automatically checked.
  property(name: string): SsProperty {
    const existing = this.member(name, SsProperty);
    if (existing === undefined) {
      const created = new SsProperty(this, name);
      this.lt.add(created);
      this.members.set(name, created);
      return created;
    } else {
      return existing;
    }
  }

  /// Object must have an action with the given name. This is not automatically checked.
  action<R extends RuntimeType, T extends SsValue = RealTypeOf<R>>(name: string, rtType: R): SsAction<T> {
    // _rtType is used only for type deduction
    const existing = this.member<SsAction<T>>(name, SsAction);
    if (existing === undefined) {
      const created = new SsAction<T>(this, name, indirectRuntimeType(rtType));
      this.lt.add(created);
      this.members.set(name, created);
      return created;
    } else {
      if (!runtimeTypeEquals(existing.rtType, rtType)) {
        throw Error(
          this.id + '.' + name +
          ' can not be created with type ' +
          runtimeTypeName(rtType) +
          ' because it was already created with type ' +
          runtimeTypeName(existing.rtType)
        );
      }
      return existing;
    }
  }

  /// Object must have an event with the given name. This is not automatically checked.
  signal<R extends RuntimeType, T extends SsValue = RealTypeOf<R>>(name: string, rtType: R): SsSignal<T> {
    const existing = this.member<SsSignal<T>>(name, SsSignal);
    if (existing === undefined) {
      const created = new SsSignal<T>(this, name, indirectRuntimeType(rtType));
      this.lt.add(created);
      this.members.set(name, created);
      return created;
    } else {
      if (!runtimeTypeEquals(existing.rtType, rtType)) {
        throw Error(
          this.id + '.' + name +
          ' can not be created with type ' +
          runtimeTypeName(rtType) +
          ' because it was already created with type ' +
          runtimeTypeName(existing.rtType)
        );
      }
      return existing;
    }
  }

  /// Used internally, Get or create a property, action or event
  private member<T extends Member>(name: string, memberClass: MemberConstructor<T>): T | undefined {
    if (!this.lt.isAlive()) {
      throw new Error(
        this.id + '.' + name +
        ' can not be created since the object has been destroyed'
      );
    }
    let member = this.members.get(name)!;
    if (member !== undefined && (
        !(member instanceof memberClass)
    )) {
      throw new Error(
        this.id + '.' + name +
        ' can not be created as a ' + memberClass.name +
        ' because it was already created as a ' + member.constructor.name
      );
    }
    return member;
  }

  /// Called by members
  makeRequest(rq: SsRequest) {
    this.connection.makeRequest(rq);
  }

  /// Called by the connection.
  handleUpdate(name: string, value: SsValue) {
    this.property(name).handleUpdate(value);
  }

  /// Called by the connection.
  handleGetReply(name: string, value: SsValue) {
    this.property(name).handleGetReply(value);
  }

  /// Called by the connection.
  handleSignal(name: string, value: SsValue) {
    try {
      this.member(name, SsSignal)?.handleSignal(value);
    } catch (e) {
      throw new Error(this.id + '.' + name + ' signal: ' + e.message);
    }
  }

  dispose() {
    this.members.clear();
    this.lt.dispose();
  }
}

