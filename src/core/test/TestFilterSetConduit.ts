import { FilterSetConduit } from '../FilterSetConduit';
import { LocalSetProperty } from '../LocalSetProperty';
import { LocalProperty } from '../LocalProperty';
import { DependentLifetime } from '../Lifetime';

test('FilterSetConduit gets initial items', () => {
  const events: any[] = [];
  const localSet = new LocalSetProperty();
  localSet.add(5);
  localSet.add(55);
  const filterSet = new FilterSetConduit(localSet, (_lt, item: any) => {
    return new LocalProperty(item < 10);
  });
  const lt = new DependentLifetime();
  filterSet.subscribe(lt, ([lt, item]) => {
    events.push([item, true]);
    lt.addCallback(() => {
      events.push([item, false]);
    });
  });
  localSet.add(7);
  localSet.add(77);
  expect(Array.from(filterSet.keys())).toEqual([5, 7]);
  expect(filterSet.has(5)).toBe(true);
  expect(filterSet.has(55)).toBe(false);
  expect(events).toEqual([
    [5, true],
    [7, true],
  ]);
});

test('FilterSetConduit throws when not yet subscribed to', () => {
  const localSet = new LocalSetProperty();
  localSet.add(5);
  const filterSet = new FilterSetConduit(localSet, (_lt, item: any) => {
    return new LocalProperty(item < 10);
  });
  expect(() => {
    filterSet.keys();
  }).toThrow(Error);
  expect(() => {
    filterSet.has(5);
  }).toThrow(Error);
});

test('FilterSetConduit gets items added to inner set', () => {
  const events: any[] = [];
  const localSet = new LocalSetProperty();
  const filterSet = new FilterSetConduit(localSet, (_lt, item: any) => {
    return new LocalProperty(item < 10);
  });
  const lt = new DependentLifetime();
  filterSet.subscribe(lt, ([lt, item]) => {
    events.push([item, true]);
    lt.addCallback(() => {
      events.push([item, false]);
    });
  });
  localSet.add(5);
  localSet.add(55);
  localSet.add(7);
  localSet.add(77);
  expect(Array.from(filterSet.keys())).toEqual([5, 7]);
  expect(filterSet.has(5)).toBe(true);
  expect(filterSet.has(55)).toBe(false);
  expect(events).toEqual([
    [5, true],
    [7, true],
  ]);
});

test('FilterSetConduit item removed and re-added depending on property', () => {
  const events: any[] = [];
  const localSet = new LocalSetProperty();
  const properties = new Map();
  const filterSet = new FilterSetConduit(localSet, (_lt, item: any) => {
    properties.set(item, new LocalProperty(true));
    return properties.get(item);
  });
  const lt = new DependentLifetime();
  filterSet.subscribe(lt, ([lt, item]) => {
    events.push([item, true]);
    lt.addCallback(() => {
      events.push([item, false]);
    });
  });
  localSet.add(5);
  localSet.add(7);
  expect(Array.from(filterSet.keys())).toEqual([5, 7]);
  properties.get(5).set(false);
  expect(Array.from(filterSet.keys())).toEqual([7]);
  properties.get(5).set(true);
  expect(Array.from(filterSet.keys())).toEqual([7, 5]);
  expect(events).toEqual([
    [5, true],
    [7, true],
    [5, false],
    [5, true],
  ]);
});
