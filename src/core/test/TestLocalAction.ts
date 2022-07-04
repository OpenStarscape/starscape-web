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

test('LocalAction value lifetime', () => {
  const events: any[] = [];
  const action = new LocalAction();
  const lt = new DependentLifetime();
  action.subscribeWithValueLifetime(lt, (valueLt, value) => {
    events.push([value, true]);
    valueLt.addCallback(() => {
      events.push([value, false]);
    });
  });
  action.fire(3);
  action.fire(5);
  expect(events).toEqual([
    [3, true],
    [3, false],
    [5, true],
  ]);
});

test('LocalAction value lifetime killed with subscriber lifetime', () => {
  const events_a: any[] = [];
  const events_b: any[] = [];
  const action = new LocalAction();
  const lt_a = new DependentLifetime();
  const lt_b = new DependentLifetime();
  action.subscribeWithValueLifetime(lt_a, (valueLt, value) => {
    events_a.push([value, true]);
    valueLt.addCallback(() => {
      events_a.push([value, false]);
    });
  });
  action.subscribeWithValueLifetime(lt_b, (valueLt, value) => {
    events_b.push([value, true]);
    valueLt.addCallback(() => {
      events_b.push([value, false]);
    });
  });
  action.fire(3);
  lt_b.kill();
  expect(events_a).toEqual([
    [3, true],
  ]);
  expect(events_b).toEqual([
    [3, true],
    [3, false],
  ]);
  action.fire(5);
  expect(events_a).toEqual([
    [3, true],
    [3, false],
    [5, true],
  ]);
  expect(events_b).toEqual([
    [3, true],
    [3, false],
  ]);
});
