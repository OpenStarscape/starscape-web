import { Scene } from '../Scene';
import { Lifetime, LocalAction } from '../../core';

// Lifetime mock
const mockLt = {
  own: (d: any) => { return d; },
  addCallback: (c: any) => {},
} as unknown as Lifetime;

test('Can construct Scene without animation', () => {
  new Scene(mockLt, document.createElement('div'), null);
});

test('Can construct Scene with animation', () => {
  const timer: any = new LocalAction();
  new Scene(mockLt, document.createElement('div'), timer);
});

test('Updates subscribers on frame', () => {
  const timer: any = new LocalAction();
  const scene = new Scene(mockLt, document.createElement('div'), timer);
  let calls = 0;
  scene.subscribe(mockLt, () => {
    calls += 1;
  });
  timer.fire();
  timer.fire();
  timer.fire();
  expect(calls).toBe(3);
});
