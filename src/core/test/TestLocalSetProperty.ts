import { LocalSetProperty } from '../LocalSetProperty';
import { DependentLifetime } from '../Lifetime';

test('LocalSetProperty notified of items added before subscribe', () => {
  const events: any[] = [];
  const localSet = new LocalSetProperty();
  localSet.add(5);
  localSet.add(7);
  expect(Array.from(localSet.keys())).toEqual([5, 7]);
  expect(localSet.has(7)).toBe(true);
  expect(localSet.has(12)).toBe(false);
  const lt = new DependentLifetime();
  localSet.subscribe(lt, ([lt, item]) => {
    events.push([item, true]);
    lt.addCallback(() => {
      events.push([item, false]);
    });
  });
  expect(events).toEqual([
    [5, true],
    [7, true],
  ]);
});


test('LocalSetProperty duplicate items are ignored', () => {
  const events: any[] = [];
  const localSet = new LocalSetProperty();
  const lt = new DependentLifetime();
  localSet.subscribe(lt, ([lt, item]) => {
    events.push([item, true]);
    lt.addCallback(() => {
      events.push([item, false]);
    });
  });
  localSet.add(5);
  localSet.add(7);
  localSet.add(7);
  localSet.add(5);
  expect(Array.from(localSet.keys())).toEqual([5, 7]);
  expect(localSet.has(7)).toBe(true);
  expect(localSet.has(12)).toBe(false);
  expect(events).toEqual([
    [5, true],
    [7, true],
  ]);
});
