import { LocalProperty } from '../LocalProperty';
import { Lifetime } from '../Lifetime'; // TODO: mock lifetime?

const lt = new Lifetime();

test('LocalProperty subscribe and set', () => {
  const events: any[] = [];
  const prop = new LocalProperty(0);
  prop.subscribe(lt, value => {
    events.push(value);
  });
  prop.set(7);
  prop.set(3);
  expect(events).toEqual([0, 7, 3]);
});

test('LocalProperty multi subscribers', () => {
  const events_a: any[] = [];
  const events_b: any[] = [];
  const action = new LocalProperty(0);
  action.subscribe(lt, value => {
    events_a.push(value);
  });
  action.set(7);
  action.subscribe(lt, value => {
    events_b.push(value);
  });
  action.set(3);
  expect(events_a).toEqual([0, 7, 3]);
  expect(events_b).toEqual([7, 3]);
});

test('LocalProperty no subscribers', () => {
  const prop = new LocalProperty(0);
  prop.set(7);
  prop.set(3);
});

test('LocalProperty get value', () => {
  const prop = new LocalProperty(54);
  expect(prop.get()).toEqual(54);
  prop.set(7);
  expect(prop.get()).toEqual(7);
});

test('LocalProperty filters equal values', () => {
  const events: any[] = [];
  const prop = new LocalProperty(0);
  prop.subscribe(lt, value => {
    events.push(value);
  });
  prop.set(0);
  prop.set(7);
  prop.set(7);
  prop.set(7);
  expect(events).toEqual([0, 7]);
});

test('LocalProperty filters equal values well', () => {
  const events: any[] = [];
  const prop = new LocalProperty(0);
  prop.subscribe(lt, value => {
    events.push(value);
  });
  prop.set(NaN);
  prop.set(NaN);
  expect(events).toEqual([0, NaN]);
});
