import { SsObject } from '../SsObject';
import { SsConnection } from '../SsConnection';
import { Lifetime } from '../../core';
import { SsSet } from '..';

type Log = {added: any} | {removed: any};

test('foo', () => {

})

function setup(): [Log[], (_: any) => void, (_: any) => void] {
  const mockConn = {
    addChild: (_a: any) => {},
    makeRequest: (_a: any) => {},
  } as unknown as SsConnection;
  const obj = new SsObject(mockConn, 22);
  const prop = obj.property('foo', {arrayOf: undefined} as any);
  let values: any[] = [];
  const add = (value: any) => {
    expect(values.includes(value)).toBe(false);
    values = values.slice();
    values.push(value);
    prop.set(values);
  }
  const remove = (value: any) => {
    const i = values.indexOf(value);
    expect(i).toBeGreaterThanOrEqual(0);
    values = values.slice();
    values.splice(i, 1);
    prop.set(values);
  }
  const log: Log[] = [];
  new SsSet(prop, new Lifetime(), (itemLt, item) => {
    log.push({added: item});
    itemLt.addCallback(() => {
      log.push({removed: item});
    });
  });
  return [log, add, remove];
}

test('SsSet can be empty', () => {
  const [log, _add, _remove] = setup();
  expect(log).toEqual([]);
});

test('SsSet add element', () => {
  const [log, add, _remove] = setup();
  add(7);
  expect(log).toEqual([{added: 7}]);
});

test('SsSet add and remove element', () => {
  const [log, add, remove] = setup();
  add(7);
  remove(7);
  expect(log).toEqual([{added: 7}, {removed: 7}]);
});

test('SsSet remove element after multiple added', () => {
  const [log, add, remove] = setup();
  add(2);
  add(4);
  add(6);
  remove(4);
  expect(log).toEqual([
    {added: 2},
    {added: 4},
    {added: 6},
    {removed: 4},
  ]);
});

test('SsSet add and remove element multiple times', () => {
  const [log, add, remove] = setup();
  add(2);
  add(4);
  add(6);
  remove(4);
  add(4);
  remove(4);
  expect(log).toEqual([
    {added: 2},
    {added: 4},
    {added: 6},
    {removed: 4},
    {added: 4},
    {removed: 4},
  ]);
});
