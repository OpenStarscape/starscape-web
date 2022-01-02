import { SsObject } from '../SsObject';
import { SsConnection } from '../SsConnection';
import { DependentLifetime } from '../../core';
import { SsSet } from '..';

const mockConn = {
  addDependent: (_a: any) => {},
  makeRequest: (_a: any) => {},
} as unknown as SsConnection;

function setupWithObj(obj: SsObject): [SsSet<any>, (_: any) => void, (_: any) => void] {
  const prop = obj.property('foo', {arrayOf: undefined} as any);
  // Having an active subscriber means the property will cache the values we give it,
  // which is required for some of the tests
  prop.subscribe(new DependentLifetime(), (_) => {});
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
  return [new SsSet(prop), add, remove];
}

function setup(): [SsSet<any>, (_: any) => void, (_: any) => void] {
  return setupWithObj(new SsObject(mockConn, 22));
}

type Log = {added: any} | {removed: any};

function subscribeLogger(sss: SsSet<any>): [DependentLifetime, Log[]] {
  const lt = new DependentLifetime();
  const log: Log[] = [];
  sss.subscribe(lt, ([itemLt, item]) => {
    log.push({added: item});
    itemLt.addCallback(() => {
      log.push({removed: item});
    });
  })
  return [lt, log];
}

test('SsSet can be empty', () => {
  const [sss, _add, _remove] = setup();
  const [_lt, log] = subscribeLogger(sss);
  expect(log).toEqual([]);
});

test('SsSet add element', () => {
  const [sss, add, _remove] = setup();
  const [_lt, log] = subscribeLogger(sss);
  add(7);
  expect(log).toEqual([{added: 7}]);
});

test('SsSet add and remove element', () => {
  const [sss, add, remove] = setup();
  const [_lt, log] = subscribeLogger(sss);
  add(7);
  remove(7);
  expect(log).toEqual([{added: 7}, {removed: 7}]);
});

test('SsSet remove element after multiple added', () => {
  const [sss, add, remove] = setup();
  const [_lt, log] = subscribeLogger(sss);
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
  const [sss, add, remove] = setup();
  const [_lt, log] = subscribeLogger(sss);
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

test('SsSet multiple subscribers', () => {
  const [sss, add, remove] = setup();
  const [_lt0, log0] = subscribeLogger(sss);
  const [_lt1, log1] = subscribeLogger(sss);
  add(7);
  remove(7);
  expect(log0).toEqual([{added: 7}, {removed: 7}]);
  expect(log1).toEqual([{added: 7}, {removed: 7}]);
});

test('SsSet subscriber can be removed', () => {
  const [sss, add, remove] = setup();
  const [lt0, log0] = subscribeLogger(sss);
  const [_lt1, log1] = subscribeLogger(sss);
  add(7);
  remove(7);
  lt0.kill();
  add(3);
  expect(log0).toEqual([{added: 7}, {removed: 7}]);
  expect(log1).toEqual([{added: 7}, {removed: 7}, {added: 3}]);
});

test('SsSet item removed when subscriber removed', () => {
  const [sss, add, _remove] = setup();
  const [lt, log] = subscribeLogger(sss);
  add(7);
  lt.kill();
  expect(log).toEqual([{added: 7}, {removed: 7}]);
});

test('SsSet item not removed for all when one subscriber removed', () => {
  const [sss, add, _remove] = setup();
  const [lt0, log0] = subscribeLogger(sss);
  const [_lt1, log1] = subscribeLogger(sss);
  add(7);
  lt0.kill();
  add(3);
  expect(log0).toEqual([{added: 7}, {removed: 7}]);
  expect(log1).toEqual([{added: 7}, {added: 3}]);
});

test('SsSet items removed when object destroyed', () => {
  const obj = new SsObject(mockConn, 22);
  const [sss, add, _remove] = setupWithObj(obj);
  const [_lt, log] = subscribeLogger(sss);
  add(7);
  add(3);
  obj.kill();
  expect(log).toEqual([{added: 7}, {added: 3}, {removed: 7}, {removed: 3}]);
});

test('SsSet subscriber lifetime not killed when object destroyed', () => {
  const obj = new SsObject(mockConn, 22);
  const [sss, add, _remove] = setupWithObj(obj);
  const [lt, _log] = subscribeLogger(sss);
  lt.addCallback(() => {
    fail();
  })
  add(7);
  obj.kill();
});

test('SsSet items added when first subscribed', () => {
  const [sss, add, _remove] = setup();
  add(7);
  add(3);
  const [_lt, log] = subscribeLogger(sss);
  expect(log).toEqual([{added: 7}, {added: 3}]);
});

test('SsSet items that have been removed not added when first subscribed', () => {
  const [sss, add, remove] = setup();
  add(7);
  add(3);
  remove(7);
  const [_lt, log] = subscribeLogger(sss);
  expect(log).toEqual([{added: 3}]);
});
