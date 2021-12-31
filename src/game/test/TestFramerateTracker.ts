import { FramerateTracker } from '../FramerateTracker';
import { Lifetime } from '../../core';

const mockLt = {
  add: () => {},
} as any;

test('FramerateTracker initially null', () => {
  const fps = new FramerateTracker();
  fps.subscribe(new Lifetime(), (_) => {});
  expect(fps.get()).toBe(null);
  fps.recordFrame();
  expect(fps.get()).toBe(null);
});

test('FramerateTracker not null after two frames', () => {
  const fps = new FramerateTracker();
  fps.subscribe(new Lifetime(), (_) => {});
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).not.toBe(null);
});

test('FramerateTracker detects correct FPS after two frames', () => {
  const timestamps = [1000, 1050];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.subscribe(new Lifetime(), (_) => {});
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).toBe(20);
});

test('FramerateTracker detects FPS based on average frame time', () => {
  const timestamps = [1000, 1050, 1200];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.subscribe(new Lifetime(), (_) => {});
  fps.recordFrame();
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).toBe(10); // NOTE: average frame time, NOT average FPS
});

test('FramerateTracker only uses limited number of samples', () => {
  const timestamps = [1000, 1050, 1100, 1250];
  const fps = new FramerateTracker(2, () => timestamps.shift()!);
  fps.subscribe(new Lifetime(), (_) => {});
  fps.recordFrame();
  fps.recordFrame();
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).toBe(10); // average frame time, ignoring the first one
});

test('FramerateTracker can be subscribed to', () => {
  const timestamps = [1000, 1050, 1200];
  const results: number[] = [];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.subscribe(mockLt, fps => results.push(fps));
  expect(results).toEqual([]);
  fps.recordFrame();
  fps.recordFrame();
  expect(results).toEqual([20]);
  fps.recordFrame();
  expect(results).toEqual([20, 10]);
});

test('FramerateTracker does not send duplicate data to subscriber', () => {
  const timestamps = [1000, 1050, 1100];
  const results: number[] = [];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.subscribe(mockLt, fps => results.push(fps));
  expect(results).toEqual([]);
  fps.recordFrame();
  expect(results).toEqual([]);
  fps.recordFrame();
  expect(results).toEqual([20]);
  fps.recordFrame();
  expect(results).toEqual([20]);
});
