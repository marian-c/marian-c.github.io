import { type CpuMemoryBus } from '@/vendor-in/my-emulator/6502/olc6502';
import { type UInt16, type UInt8 } from '@/vendor-in/my-emulator/_/numbers';
import type {
  BusDevice,
  BusDeviceConstructorAndStatic,
  BusDeviceConstructorP,
} from '@/emulator/types';
import { ShouldNotHappenError } from '@/vendor-in/my-emulator/_/errors';

export abstract class BusDeviceWithConstructor implements BusDevice {
  bus: CpuMemoryBus;
  startAddress: UInt16;
  endAddress: UInt16;
  instanceName: string;
  instanceId: string;

  protected constructor(
    bus: CpuMemoryBus,
    { startAddress, instanceName, instanceId }: BusDeviceConstructorP,
  ) {
    this.bus = bus;
    this.startAddress = startAddress;
    this.instanceName = instanceName;
    this.instanceId = instanceId;
    const endAddress =
      this.startAddress + (this.constructor as BusDeviceConstructorAndStatic).pinsOccupied ** 2;
    if (endAddress > 0xffff) {
      throw new ShouldNotHappenError('End address for bus device out of bounds');
    }
    this.endAddress = endAddress as UInt16;
  }

  abstract cpuRead(address: UInt16): UInt8;
  abstract cpuWrite(address: UInt16, data: UInt8): void;
  abstract reset(): void;
  abstract getUI(): React.ReactNode;
}
