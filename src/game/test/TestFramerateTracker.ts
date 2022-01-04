import { FramerateTracker, FramerateInfo } from '../FramerateTracker';
import { setupTimer } from './setupTimer';
import { DependentLifetime } from '../../core';

const mockLt = {
  own: (d: any) => { return d; },
} as any;

function setup(samples?: number): [fps: FramerateTracker, recordFrame: (time: number) => void] {
  const [timer, _sendGameTime, nextAnimFrame] = setupTimer();
  const fps = new FramerateTracker(timer, samples ?? 10);
  return [fps, nextAnimFrame];
}

test('FramerateTracker initially null', () => {
  const [fps, recordFrame] = setup();
  fps.subscribe(new DependentLifetime(), (_) => {});
  expect(fps.get()).toBe(null);
  recordFrame(1);
  expect(fps.get()).toBe(null);
});

test('FramerateTracker not null after two frames', () => {
  const [fps, recordFrame] = setup();
  fps.subscribe(new DependentLifetime(), (_) => {});
  recordFrame(1);
  recordFrame(2);
  expect(fps.get()).not.toBe(null);
});

test('FramerateTracker detects correct FPS after two frames', () => {
  const [fps, recordFrame] = setup();
  fps.subscribe(new DependentLifetime(), (_) => {});
  recordFrame(1000);
  recordFrame(1050);
  expect(fps.get()).toEqual({average: 20, min: 20});
});

test('FramerateTracker detects FPS based on average frame time', () => {
  const [fps, recordFrame] = setup();
  fps.subscribe(new DependentLifetime(), (_) => {});
  recordFrame(1000);
  recordFrame(1050);
  recordFrame(1250);
  expect(fps.get()).toEqual({average: 8, min: 5}); // NOTE: average frame time, NOT average FPS
});

test('FramerateTracker only uses limited number of samples', () => {
  const [fps, recordFrame] = setup(2);
  fps.subscribe(new DependentLifetime(), (_) => {});
  recordFrame(1000);
  recordFrame(1050);
  recordFrame(1100);
  recordFrame(1300);
  expect(fps.get()).toEqual({average: 8, min: 5}); // average frame time, ignoring the first one
});

test('FramerateTracker can be subscribed to', () => {
  const results: FramerateInfo[] = [];
  const [fps, recordFrame] = setup();
  fps.subscribe(mockLt, fps => results.push(fps));
  expect(results).toEqual([]);
  recordFrame(1000);
  recordFrame(1050);
  expect(results).toEqual([{average: 20, min: 20}]);
  recordFrame(1250);
  expect(results).toEqual([{average: 20, min: 20}, {average: 8, min: 5}]);
});

test('FramerateTracker does not send duplicate data to subscriber', () => {
  const results: FramerateInfo[] = [];
  const [fps, recordFrame] = setup();
  fps.subscribe(mockLt, fps => results.push(fps));
  expect(results).toEqual([]);
  recordFrame(1000);
  expect(results).toEqual([]);
  recordFrame(1050);
  expect(results).toEqual([{average: 20, min: 20}]);
  recordFrame(1100);
  expect(results).toEqual([{average: 20, min: 20}]);
});
