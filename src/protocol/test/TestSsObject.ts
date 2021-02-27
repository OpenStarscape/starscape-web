import { SsConnection } from '../SsConnection';
import { SsObject } from '../SsObject';
import { SsProperty } from '../SsProperty';
import { SsSignal } from '../SsSignal';
import { SsAction } from '../SsAction';
import { Lifetime } from '../../core';

class MockConnection {
  lifetime() {
    return new Lifetime();
  }
}

function newObject() {
  return new SsObject(
    new MockConnection() as unknown as SsConnection,
    12
  );
}

test('SsObject can get property', () => {
  const obj = newObject();
  const prop = obj.property('foo');
  expect(prop).toBeInstanceOf(SsProperty);
});

test('SsObject can get signal', () => {
  const obj = newObject();
  const sig = obj.signal('foo');
  expect(sig).toBeInstanceOf(SsSignal);
});

test('SsObject can get action', () => {
  const obj = newObject();
  const act = obj.action('foo');
  expect(act).toBeInstanceOf(SsAction);
});

test('SsObject getting same member multiple times returns same', () => {
  const obj = newObject();
  const prop = obj.property('prop');
  const sig = obj.signal('sig');
  const act = obj.action('act');
  expect(obj.property('prop')).toBe(prop);
  expect(obj.signal('sig')).toBe(sig);
  expect(obj.action('act')).toBe(act);
});

test('SsObject getting different member type with same name error', () => {
  const obj = newObject();
  obj.property('prop');
  obj.signal('sig');
  obj.action('act');
  expect(() => {
    obj.signal('prop');
  }).toThrow('12.prop can not be created as a SsSignal because it was already created as a SsProperty')
  expect(() => {
    obj.action('sig');
  }).toThrow('12.sig can not be created as a SsAction because it was already created as a SsSignal')
  expect(() => {
    obj.property('act');
  }).toThrow('12.act can not be created as a SsProperty because it was already created as a SsAction')
});

test('SsObject kills conduits on dispose', () => {
  const obj = newObject();
  const prop = obj.property('prop');
  const sig = obj.signal('sig');
  const act = obj.action('act');
  expect(prop.isAlive()).toEqual(true);
  expect(sig.isAlive()).toEqual(true);
  expect(act.isAlive()).toEqual(true);
  obj.dispose();
  expect(prop.isAlive()).toEqual(false);
  expect(sig.isAlive()).toEqual(false);
  expect(act.isAlive()).toEqual(false);
});
