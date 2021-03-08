import { FramerateTracker } from '../FramerateTracker';

const mockLt = {
  add: () => {},
} as any;

test('FramerateTracker initially zero', () => {
  const fps = new FramerateTracker();
  expect(fps.get()).toBe(0);
  fps.recordFrame();
  expect(fps.get()).toBe(0);
});

test('FramerateTracker not zero after two frames', () => {
  const fps = new FramerateTracker();
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).not.toBe(0);
});

test('FramerateTracker detects correct FPS after two frames', () => {
  const timestamps = [1000, 1050];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).toBe(20);
});

test('FramerateTracker detects FPS based on average frame time', () => {
  const timestamps = [1000, 1050, 1200];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.recordFrame();
  fps.recordFrame();
  fps.recordFrame();
  expect(fps.get()).toBe(10); // NOTE: average frame time, NOT average FPS
});

test('FramerateTracker only uses limited number of samples', () => {
  const timestamps = [1000, 1050, 1100, 1250];
  const fps = new FramerateTracker(2, () => timestamps.shift()!);
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
  expect(results).toEqual([0]);
  fps.recordFrame();
  fps.recordFrame();
  expect(results).toEqual([0, 20]);
  fps.recordFrame();
  expect(results).toEqual([0, 20, 10]);
});

test('FramerateTracker does not send duplicate data to subscriber', () => {
  const timestamps = [1000, 1050, 1100];
  const results: number[] = [];
  const fps = new FramerateTracker(10, () => timestamps.shift()!);
  fps.subscribe(mockLt, fps => results.push(fps));
  expect(results).toEqual([0]);
  fps.recordFrame();
  expect(results).toEqual([0]);
  fps.recordFrame();
  expect(results).toEqual([0, 20]);
  fps.recordFrame();
  expect(results).toEqual([0, 20]);
});
