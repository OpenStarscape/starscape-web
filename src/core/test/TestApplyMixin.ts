import { applyMixin } from '../applyMixin';

class BaseA {
  readonly baseAProp: string;

  constructor(
    readonly baseAArg: string
  ) {
    this.baseAProp = 'prop A';
  }

  baseAFunc() {
    return 'result A';
  }
}

class BaseB {
  public baseBProp?: string;
  public baseBArg?: string;

  initBaseB(arg: string) {
    this.baseBProp = 'prop B';
    this.baseBArg = arg
  }

  baseBFunc() {
    return 'result B';
  }
}

interface Derived extends BaseB {}
class Derived extends BaseA {
  readonly derivedProp: string;

  constructor() {
    super('arg A')
    this.initBaseB('arg B');
    this.derivedProp = 'prop derived';
  }

  derivedFunc() {
    return 'result derived';
  }
}

applyMixin(Derived, BaseB);

test('properties work', () => {
  const obj = new Derived();
  expect(obj.baseAProp).toEqual('prop A');
  expect(obj.baseBProp).toEqual('prop B');
  expect(obj.derivedProp).toEqual('prop derived');
  // expect(obj.nonexistant).toEqual(undefined); // should not typecheck
});

test('arguments work', () => {
  const obj = new Derived();
  expect(obj.baseAArg).toEqual('arg A');
  expect(obj.baseBArg).toEqual('arg B');
});

test('functions work', () => {
  const obj = new Derived();
  expect(obj.baseAFunc()).toEqual('result A');
  expect(obj.baseBFunc()).toEqual('result B');
  expect(obj.derivedFunc()).toEqual('result derived');
});
