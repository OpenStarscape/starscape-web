import Lifetime from '../lib/Lifetime';
import { SsConnection } from './SsConnection';
import { SsProperty } from './SsProperty'
import { SsAction } from './SsAction'
import { SsSignal } from './SsSignal'

/// A handle to an object on the server. Is automatically created by the connection.
export class SsObject {
  readonly lt = new Lifetime();
  private members = new Map<string, any>();

  constructor(
    readonly connection: SsConnection, // TODO: is this needed?
    readonly id: number
  ) {
    connection.lifetime().add(this.lt);
  }

  /// Object must have a property with the given name. This is not automatically checked.
  property(name: string) {
    return this.member(name, SsProperty) as SsProperty;
  }

  /// Object must have an action with the given name. This is not automatically checked.
  action(name: string) {
    return this.member(name, SsAction) as SsAction;
  }

  /// Object must have an event with the given name. This is not automatically checked.
  signal(name: string) {
    return this.member(name, SsSignal) as SsSignal;
  }

  /// Used internally, Get or create a property, action or event
  member(name: string, memberClass: any): any {
    if (!this.lt.isAlive()) {
      throw new Error(
        this.id + '.' + name +
        ' can not be created since the object has been destroyed'
      );
    }
    let member = this.members.get(name);
    if (!member) {
      member = new memberClass(this, name);
      this.lt.add(member);
      this.members.set(name, member);
    } else if (!(member instanceof memberClass)) {
      throw new Error(
        this.id + '.' + name +
        ' can not be created as a ' + memberClass.constructor.name +
        ' because it was already created as a ' + member.constructor.name
      );
    }
    return member;
  }

  /// Called by the connection.
  handleUpdate(name: string, value: any) {
    const member = this.member(name, SsProperty);
    member.handleUpdate(value);
  }

  /// Called by the connection.
  handleGetReply(name: string, value: any) {
    const member = this.member(name, SsProperty);
    member.handleGetReply(value);
  }

  /// Called by the connection.
  handleSignal(name: string, value: any) {
    const member = this.member(name, SsSignal);
    member.handleEvent(value);
  }

  dispose() {
    this.members.clear();
    this.lt.dispose();
  }
}

