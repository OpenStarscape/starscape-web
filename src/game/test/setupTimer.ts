import { AnimationTimer } from '../AnimationTimer';

export function setupTimer(): [
  timer: AnimationTimer,
  sendGameTime: (time: number) => void,
  nextAnimFrame: (time: number) => void,
] {
  let sendGameTime = (_time: number) => {}
  const mockRoot = {
    property: (name: any, _rtType: any) => {
      if (name === 'time') {
        return {
          subscribe: (_lt: any, callback: any) => {
            sendGameTime = callback;
          }
        }
      } else {
        return {
          subscribe: (_lt: any, _callback: any) => {}
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
