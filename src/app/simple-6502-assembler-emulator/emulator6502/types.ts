import type { Rom } from '@/emulator/types';
import type { Bus } from '@/emulator/bus';
import { type BusConfiguration } from '@/emulator/bus';

export interface EmulationDriver6502 {
  calculatedSpeedInHz: number;
  setSpeed: (speedInHz: number) => void;
  onStateSignalChange: (fn: (stateSignalValue: number) => void, wait: number) => () => void;
  start: () => void;
  stop: () => void;
  setRom: (romDetails: RomInformation) => void;

  getBus: () => Bus;
}

export type DisplayMode = 'normal' | 'max';

export type RomInformation = Rom & {
  type: 'user_supplied' | 'sample' | 'compiled' | 'empty';
  description: string;
};

export type SourceCompiledStatus = 'yes' | 'errors' | 'outdated';
export type SourceLoadedStatus = 'yes' | 'outdated';

export type ComputerConfiguration = {
  busConfiguration: BusConfiguration;
};
