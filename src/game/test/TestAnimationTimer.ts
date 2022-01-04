import { AnimationTimer } from '../AnimationTimer';
import { DependentLifetime } from '../../core';

function setup(): [
  timer: AnimationTimer,
  sendGameTime: (time: number) => void,
  nextAnimFrame: (time: number) => void,
] {
  let sendGameTime = (_time: number) => {}
  const mockRoot = {
    property: (name: any, _rtType: any) => {
      expect(name).toBe('time');
      return {
        subscribe: (_lt: any, callback: any) => {
          sendGameTime = callback;
        }
      }
    }
  } as any;
  let lastAnimFrameTime = 0;
  let runNextAnimFrame = (_time: number) => {}
  const timer = new AnimationTimer(
    mockRoot, () => {
      return lastAnimFrameTime;
    }, (callback: (ms: number) => void) => {
      runNextAnimFrame = (time: number) => {
        lastAnimFrameTime = time;
        callback(time * 1000);
      };
    },
  );
  return [
    timer,
    (time: number) => {
      sendGameTime(time);
    },
    (time: number) => {
      runNextAnimFrame(time);
    },
  ];
}

test('AnimationTimer gameTime() initially null', () => {
  const [timer, _sendGameTime, _nextAnimFrame] = setup();
  expect(timer.gameTime()).toBe(null);
});

test('AnimationTimer gameTime() stays null if not subscribed', () => {
  const [timer, sendGameTime, _nextAnimFrame] = setup();
  sendGameTime(5);
  expect(timer.gameTime()).toBe(null);
});

test('AnimationTimer sends on initial subscribe', () => {
  const [timer, _sendGameTime, _nextAnimFrame] = setup();
  const browserTimes: {game: number | null, browser: number}[] = [];
  timer.subscribe(new DependentLifetime(), () => {
    browserTimes.push({
      game: timer.gameTime(),
      browser: timer.browserTime(),
    });
  });
  expect(browserTimes).toEqual([
    {game: null, browser: 0},
  ]);
});

test('AnimationTimer game time stays null if no game given', () => {
  const [timer, _sendGameTime, nextAnimFrame] = setup();
  const browserTimes: {game: number | null, browser: number}[] = [];
  timer.subscribe(new DependentLifetime(), () => {
    browserTimes.push({
      game: timer.gameTime(),
      browser: timer.browserTime(),
    });
  });
  nextAnimFrame(5);
  expect(browserTimes).toEqual([
    {game: null, browser: 0},
    {game: null, browser: 5},
  ]);
  expect(timer.gameTime()).toBe(null);
});

test('AnimationTimer is correct after 1 frame', () => {
  const [timer, sendGameTime, nextAnimFrame] = setup();
  const browserTimes: {game: number | null, browser: number}[] = [];
  timer.subscribe(new DependentLifetime(), () => {
    browserTimes.push({
      game: timer.gameTime(),
      browser: timer.browserTime(),
    });
  });
  nextAnimFrame(5);
  sendGameTime(1);
  expect(browserTimes).toEqual([
    {game: null, browser: 0},
    {game: null, browser: 5},
  ]);
  expect(timer.gameTime()).toBe(1);
});

test('AnimationTimer is correct after 2 frames', () => {
  const [timer, sendGameTime, nextAnimFrame] = setup();
  const browserTimes: {game: number | null, browser: number}[] = [];
  timer.subscribe(new DependentLifetime(), () => {
    browserTimes.push({
      game: timer.gameTime(),
      browser: timer.browserTime(),
    });
  });
  nextAnimFrame(5);
  sendGameTime(1);
  nextAnimFrame(7);
  expect(browserTimes).toEqual([
    {game: null, browser: 0},
    {game: null, browser: 5},
    {game: 3, browser: 7},
  ]);
  expect(timer.gameTime()).toBe(3);
});
