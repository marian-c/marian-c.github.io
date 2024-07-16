// driver for requestAnimationFrame and custom speed
import { noop } from '@/utils';
import throttle from 'lodash/throttle';

function fib(n: number): number {
  if (n < 2) {
    return n;
  } else return fib(n - 1) + fib(n - 2);
}

export const rafDriver = {
  state: 0,
  cb: noop as () => void,
  running: false,
  speedInHz: 1,
  timePerCycleInMs: 1000,

  carryCycles: 0, // between 0 and 1,
  previousFrameTime: 0,
  previousActualCycles: 0,
  previousDelta: 0,

  setSpeed(speedInHz: number) {
    this.speedInHz = speedInHz;
    this.timePerCycleInMs = 1000 / speedInHz;
  },
  onNewState(fn: (newState: number) => void) {
    this.cb = throttle(() => {
      this.state++;
      fn(this.state);
    }, 100);
    return () => {
      this.stop();
      this.cb = noop;
    };
  },
  instruction() {
    this.state = this.state + 1;
  },
  firstFrame(frameTime: number) {
    this.previousFrameTime = frameTime;
    this.frame(frameTime);
  },
  frame(frameTime: number) {
    if (!this.running) {
      return;
    }
    requestAnimationFrame(this.frame.bind(this));

    // TODO: handle emulation error and exception

    const delta = frameTime - (this.previousFrameTime || frameTime) || 1000 / 60;

    // do as many cycles as we need to in order to catch up

    // TODO: measure actual speed
    // TODO: if the previous number of cycles made this drop to below 20fps, slow down
    // to a minimum of say 100hz, but back off from slowing down if we're back above 30 fps

    const cyclesToComplete = (this.speedInHz * delta) / 1000 + this.carryCycles;

    const actualCyclesToComplete = Math.floor(cyclesToComplete);
    this.carryCycles = cyclesToComplete - actualCyclesToComplete;

    for (let i = 0; i < actualCyclesToComplete; i++) {
      fib(12);
    }

    this.previousFrameTime = frameTime;
    this.previousActualCycles = actualCyclesToComplete;
    this.previousDelta = delta;

    this.cb();
  },
  start() {
    this.running = true;
    requestAnimationFrame(this.firstFrame.bind(this));
  },
  stop() {
    this.running = false;
  },
};
