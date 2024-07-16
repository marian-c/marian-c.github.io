import { busDeviceParams } from '@/emulator/bus';
import { v4 as uuidv4 } from 'uuid';
import { type UInt16 } from '@/vendor-in/my-emulator/_/numbers';
import type { ComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/types';

const defaultId = uuidv4();
export const defaultComputerConfiguration: ComputerConfiguration = {
  busConfiguration: {
    devices: [
      busDeviceParams<'BusDeviceLCDDirect'>(defaultId, 'BusDeviceLCDDirect', [
        { startAddress: 0x6000 as UInt16, instanceName: 'LCD at 0x6000', instanceId: defaultId },
      ]),
    ],
  },
};

// TODO: load an LCD example, in line with the default computer configuration
export const defaultSourceCode = `; sample code\nLDX #$AB`;

// TODO: also define a precompiled binary for this sample code to load
