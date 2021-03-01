import { SsObject } from '../SsObject';
import { SsProperty } from '../SsProperty';
import { SsSignal } from '../SsSignal';
import { SsAction } from '../SsAction';

const mockConn = {
  lifetime: () => {
    return {
      add: (_: any) => {}
    };
  },
} as any;

function newObject() {
  return new SsObject(mockConn, 12);
}

test('SsObject can get property', () => {
  const obj = newObject();
  const prop = obj.property('foo');
  expect(prop).toBeInstanceOf(SsProperty);
});

test('SsObject can get signal', () => {
  const obj = newObject();
  const sig = obj.signal('foo', Number);
  expect(sig).toBeInstanceOf(SsSignal);
});

test('SsObject can get action', () => {
  const obj = newObject();
  const act = obj.action('foo', Number);
  expect(act).toBeInstanceOf(SsAction);
});

test('SsObject getting same member multiple times returns same', () => {
  const obj = newObject();
  const prop = obj.property('prop');
  const sig = obj.signal('sig', Number);
  const act = obj.action('act', Number);
  expect(obj.property('prop')).toBe(prop);
  expect(obj.signal('sig', Number)).toBe(sig);
  expect(obj.action('act', Number)).toBe(act);
});

test('SsObject getting different member type with same name error', () => {
  const obj = newObject();
  obj.property('prop');
  obj.signal('sig', Number);
  obj.action('act', Number);
  expect(() => {
    obj.signal('prop', Number);
  }).toThrow('12.prop can not be created as a SsSignal because it was already created as a SsProperty')
  expect(() => {
    obj.action('sig', Number);
  }).toThrow('12.sig can not be created as a SsAction because it was already created as a SsSignal')
  expect(() => {
    obj.property('act');
  }).toThrow('12.act can not be created as a SsProperty because it was already created as a SsAction')
});

test('SsObject getting members with different value type and same name error', () => {
  const obj = newObject();
  obj.property('prop');
  obj.signal('sig', Number);
  obj.action('act', [Boolean]);
  expect(() => {
    obj.signal('sig', String);
  }).toThrow('12.sig can not be created with type string because it was already created with type number');
  expect(() => {
    obj.action('act', [[Boolean]]);
  }).toThrow('12.act can not be created with type array because it was already created with type array');
});

test('SsObject kills conduits on dispose', () => {
  const obj = newObject();
  const prop = obj.property('prop');
  const sig = obj.signal('sig', Number);
  const act = obj.action('act', Number);
  expect(prop.isAlive()).toEqual(true);
  expect(sig.isAlive()).toEqual(true);
  expect(act.isAlive()).toEqual(true);
  obj.dispose();
  expect(prop.isAlive()).toEqual(false);
  expect(sig.isAlive()).toEqual(false);
  expect(act.isAlive()).toEqual(false);
});

test('SsObject signal validates input type', () => {
  const obj = newObject();
  obj.signal('num', Number);
  obj.handleSignal('num', 7.5);
  expect(() => {
    obj.handleSignal('num', 'hi');
  }).toThrow('12.num signal: expected number, got string')
});

test('SsObject signal validates input type', () => {
  const obj = newObject();
  obj.signal('num', Number);
  obj.handleSignal('num', 7.5);
  expect(() => {
    obj.handleSignal('num', 'hi');
  }).toThrow('12.num signal: expected number, got string')
});

test('SsObject signal with array type', () => {
  const obj = newObject();
  obj.signal('num', [Number]);
  obj.handleSignal('num', [6]);
});
