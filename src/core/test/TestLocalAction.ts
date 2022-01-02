import { LocalAction } from '../LocalAction';
import { DependentLifetime } from '../Lifetime'; // TODO: mock lifetime?

test('LocalAction subscribe and fire', () => {
  const a = {a: 1, b: 2};
  const events: any[] = [];
  const action = new LocalAction();
  const lt = new DependentLifetime();
  action.subscribe(lt, value => {
    events.push(value);
  });
  action.fire(7);
  action.fire(7);
  action.fire(a);
  expect(events).toEqual([7, 7, a]);
});

test('LocalAction multi subscribers', () => {
  const events_a: any[] = [];
  const events_b: any[] = [];
  const action = new LocalAction();
  const lt = new DependentLifetime();
  action.subscribe(lt, value => {
    events_a.push(value);
  });
  action.subscribe(lt, value => {
    events_b.push(value);
  });
  action.fire(7);
  action.fire(false);
  expect(events_a).toEqual([7, false]);
  expect(events_b).toEqual([7, false]);
});

test('LocalAction no subscribers', () => {
  const action = new LocalAction();
  action.fire(7);
  action.fire(false);
});
