import { type CpuMemoryBus, Olc6502 } from '@/vendor-in/my-emulator/6502/olc6502';
import type { UInt16, UInt8 } from '@/vendor-in/my-emulator/_/numbers';
import type { BusDeviceConstructorAndStatic, Rom } from '@/emulator/types';
import { BusDeviceLCDDirect } from '@/emulator/devices/BusDeviceLCDDirect';
import type { BusDeviceWithConstructor } from '@/emulator/BusDeviceWithConstructor';
import { BusDeviceDummy } from '@/emulator/devices/BusDeviceDummy';

export const possibleDevices = {
  BusDeviceDummy: BusDeviceDummy,
  BusDeviceLCDDirect: BusDeviceLCDDirect,
} satisfies Record<string, BusDeviceConstructorAndStatic>;

export type PossibleDevicesStrings = keyof typeof possibleDevices;

type ExcludeFirst<T> = T extends [any, ...infer Rest] ? Rest : never;
export type DeviceConfig<T extends PossibleDevicesStrings> = {
  name: PossibleDevicesStrings;
  // TODO: we need basic, serializable values here
  params: ExcludeFirst<ConstructorParameters<(typeof possibleDevices)[T]>>;
  id: string;
};

export type BusConfiguration = {
  devices: DeviceConfig<PossibleDevicesStrings>[];
};

// const config:BusConfiguration = {
//   devices: [
//     busDeviceParams('BusDevice6522', ['1']),
//   ]
// }
// helper function at the caller site
export function busDeviceParams<T extends PossibleDevicesStrings>(
  id: string,
  name: T,
  params: DeviceConfig<T>['params'],
): DeviceConfig<T> {
  return {
    id,
    name,
    params,
  };
}

export class Bus implements CpuMemoryBus {
  // TODO: Uint8Array should be faster
  mem: number[] = [];
  initialPc: UInt16 | null = null;
  cpu: Olc6502 = new Olc6502(this);
  attachedDevices: BusDeviceWithConstructor[] = [];

  constructor(rom: Rom, config: BusConfiguration) {
    this.setConfiguration(config);
    this.setRom(rom);
  }

  setConfiguration(config: BusConfiguration) {
    this.attachedDevices = [];
    config.devices.forEach((device) => {
      const ClParams: DeviceConfig<typeof device.name>['params'] = device.params;
      const Cl = possibleDevices[device.name];
      // @ts-ignore
      const inst = new Cl(this, ...ClParams);
      this.attachedDevices.push(inst);
    });
  }

  setRom(rom: Rom) {
    const data = new Uint8Array(rom.contents);

    const limit = rom.startingAddress + rom.size;

    for (let i = 0; i <= 0xffff; i++) {
      if (i < rom.startingAddress || i >= limit) {
        this.mem[i] = 0;
      } else {
        const offset = i - rom.startingAddress;
        this.mem[i] = data[offset]!;
      }
    }
    this.initialPc = rom.initialPc as UInt16;
  }

  reset() {
    this.cpu.reset(this.initialPc ?? undefined);
    this.attachedDevices.forEach((attachedDevice) => {
      attachedDevice.reset();
    });
  }

  cpuRead(address: UInt16): UInt8 {
    if (address > 0xffff) {
      throw new Error('Mem read out of bounds');
    }

    // does this fall inside any of connected devices' responsibility?
    for (let device of this.attachedDevices) {
      if (address >= device.startAddress && address <= device.endAddress) {
        return device.cpuRead(address);
      }
    }

    return this.mem[address]! as UInt8;
  }
  cpuWrite(address: UInt16, data: UInt8) {
    if (address > 0xffff) {
      throw new Error('Mem write out of bounds');
    }
    // does this fall inside any of connected devices' responsibility?
    for (let device of this.attachedDevices) {
      if (address >= device.startAddress && address <= device.endAddress) {
        return device.cpuWrite(address, data);
      }
    }
    this.mem[address] = data;
  }

  clock() {
    this.cpu.clockCPU();
  }
}
