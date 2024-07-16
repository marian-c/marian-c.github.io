import { type UInt16, type UInt8 } from '@/vendor-in/my-emulator/_/numbers';
import React from 'react';
import { type CpuMemoryBus } from '@/vendor-in/my-emulator/6502/olc6502';
import { BusDeviceWithConstructor } from '@/emulator/BusDeviceWithConstructor';

export type Rom = {
  size: number;
  startingAddress: number;
  contents: Uint8Array;
  initialPc: number | null;
};

export interface BusDevice {
  // typeIdentifier: string;
  // inputLabel: string;
  // outputLabel: string;
  // hasInput: boolean;
  // hasState: boolean;

  instanceName: string;
  instanceId: string;
  cpuRead(address: UInt16): UInt8;
  cpuWrite(address: UInt16, data: UInt8): void;
  reset(): void;

  getUI(): React.ReactNode;
}
export type BusDeviceConstructorP = {
  startAddress: UInt16;
  instanceName: string;
  instanceId: string;
};
export interface BusDeviceConstructorAndStatic {
  deviceType: string;
  pinsOccupied: number;
  hasUI: boolean;
  // makes sure the bus is in the first position, so that we can ignore it when typing the
  // constructor arguments in the config
  new (bus: CpuMemoryBus, p: BusDeviceConstructorP, ...arg: any): BusDeviceWithConstructor;
}
