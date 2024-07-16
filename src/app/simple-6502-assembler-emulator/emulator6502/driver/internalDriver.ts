import type {
  ComputerConfiguration,
  EmulationDriver6502,
} from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import type { DebouncedFunc } from 'lodash';
import throttle from 'lodash/throttle';
import { Bus } from '@/emulator/bus';
import type { Rom } from '@/emulator/types';

const BATCH_INTERVAL_MS = 1000 / 120;

export class IntervalDriver implements EmulationDriver6502 {
  bus: Bus;
  stateSignal = 0;

  calculatedSpeedInHz = 1;

  speedInHz = 1;
  timePerCycleInMs = 1000;

  prevBatchEndTime = 0;

  intervalId: ReturnType<typeof setInterval> | undefined;

  stateSignalHandlers: Array<(stateSignalNumber: number) => void> = [];
  throttledStateSignalHandlers: Array<DebouncedFunc<(stateSignalNumber: number) => void>> = [];

  lastRom: Rom;

  constructor(details: Rom, computerConfiguration: ComputerConfiguration) {
    this.bus = new Bus(details, computerConfiguration.busConfiguration);
    this.lastRom = details;
  }

  notify() {
    this.stateSignal++;
    this.stateSignalHandlers.forEach((fn) => {
      fn(this.stateSignal);
    });
  }
  notifyThrottled() {
    this.stateSignal++;
    this.throttledStateSignalHandlers.forEach((fn) => {
      fn(this.stateSignal);
    });
  }

  flushThrottled() {
    this.throttledStateSignalHandlers.forEach((fn) => {
      fn.flush();
    });
  }

  setSpeed(speedInHz: number) {
    this.speedInHz = speedInHz;
    this.timePerCycleInMs = 1000 / speedInHz;
  }

  start() {
    const cyclesToComplete = Math.max(1, BATCH_INTERVAL_MS / this.timePerCycleInMs);
    this.prevBatchEndTime = performance.now();

    this.intervalId = setInterval(() => {
      for (let i = 0; i < cyclesToComplete; i++) {
        this.bus!.clock();
      }

      const batchEndTime = performance.now();
      this.calculatedSpeedInHz = (cyclesToComplete * 1000) / (batchEndTime - this.prevBatchEndTime);

      this.prevBatchEndTime = batchEndTime;

      this.notifyThrottled();
    }, BATCH_INTERVAL_MS);
  }
  stop() {
    clearInterval(this.intervalId);
    this.flushThrottled();
  }

  onStateSignalChange(fn: (stateSignalNumber: number) => void, wait: number) {
    this.stateSignalHandlers.push(fn);
    const throttled = throttle(fn, wait);
    this.throttledStateSignalHandlers.push(throttled);
    return () => {
      this.stateSignalHandlers = this.stateSignalHandlers.filter((ssh) => ssh !== fn);
      this.throttledStateSignalHandlers = this.throttledStateSignalHandlers.filter(
        (tssh) => tssh !== throttled,
      );
    };
  }

  /**
   * You might want to stop the emulation before doing this
   */
  setConfiguration(details: Rom, computerConfiguration: ComputerConfiguration) {
    this.bus.setConfiguration(computerConfiguration.busConfiguration);
    this.setRom(details);
  }

  /**
   * You might want to stop the emulation before doing this
   */
  setRom(details: Rom) {
    this.lastRom = details;
    this.bus.setRom(details);
    this.bus.reset();
    this.notify();
  }
  /**
   * You might want to stop the emulation before doing this
   */
  reset() {
    this.bus.reset();
    this.notify();
  }
  /**
   * You might want to stop the emulation before doing this
   */
  reload() {
    this.setRom(this.lastRom);
  }

  getBus() {
    return this.bus;
  }
}
