import { Lifetime, Conduit, RealTypeOf, runtimeTypeEquals, runtimeTypeName, indirectRuntimeType} from '../core';
import { SsConnection } from './SsConnection';
import { SsProperty } from './SsProperty'
import { SsAction } from './SsAction'
import { SsSignal } from './SsSignal'
import { SsRequest } from './SsRequest'
import { SsValue, SsValueRuntimeType } from './SsValue'

type Member = (SsProperty<any> | SsAction<any> | SsSignal<any>) & Conduit<any>;
type MemberConstructor<T extends Member> = new (...args: any[]) => T

/// A handle to an object on the server. Is automatically created by the connection.
export class SsObject extends Lifetime {
  private members = new Map<string, Member>();
  private alive = true;

  constructor(
    readonly connection: SsConnection,
    readonly id: number
  ) {
    super();
    connection.addChild(this);
  }

  /// Object must have a property with the given name. This is not automatically checked.
  property<R extends SsValueRuntimeType>(name: string, rtType: R): SsProperty<RealTypeOf<R>> {
    const existing = this.member<SsProperty<RealTypeOf<R>>>(name, SsProperty);
    if (existing === undefined) {
      const created = new SsProperty(this, name, indirectRuntimeType(rtType));
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

  /// Object must have an action with the given name. This is not automatically checked.
  action<R extends SsValueRuntimeType>(name: string, rtType: R): SsAction<RealTypeOf<R>> {
    // _rtType is used only for type deduction
    const existing = this.member<SsAction<RealTypeOf<R>>>(name, SsAction);
    if (existing === undefined) {
      const created = new SsAction<RealTypeOf<R>>(this, name, indirectRuntimeType(rtType));
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
  signal<R extends SsValueRuntimeType>(name: string, rtType: R): SsSignal<RealTypeOf<R>> {
    const existing = this.member<SsSignal<RealTypeOf<R>>>(name, SsSignal);
    if (existing === undefined) {
      const created = new SsSignal<any>(this, name, indirectRuntimeType(rtType));
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
    if (!this.alive) {
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
    try {
      this.member(name, SsProperty)?.handleUpdate(value);
    } catch (e) {
      throw new Error(this.id + '.' + name + ' property: ' + e.message);
    }
  }

  /// Called by the connection.
  handleGetReply(name: string, value: SsValue) {
    try {
      this.member<any>(name, SsProperty)?.handleGetReply(value);
    } catch (e) {
      throw new Error(this.id + '.' + name + ' property: ' + e.message);
    }
  }

  /// Called by the connection.
  handleSignal(name: string, value: SsValue) {
    try {
      this.member<any>(name, SsSignal)?.handleSignal(value);
    } catch (e) {
      throw new Error(this.id + '.' + name + ' signal: ' + e.message);
    }
  }

  dispose() {
    this.alive = false;
    // eslint-disable-next-line
    for (let [_, value] of this.members) {
      value.dispose();
    }
    this.members.clear();
    super.dispose();
  }
}

