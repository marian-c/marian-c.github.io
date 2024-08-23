import { BusDeviceWithConstructor } from '@/emulator/BusDeviceWithConstructor';
import { type UInt16, type UInt8 } from '@/vendor-in/my-emulator/_/numbers';
import Image from 'next/image';
import type { BusDeviceConstructorP } from '@/emulator/types';
import { type CpuMemoryBus } from '@/vendor-in/my-emulator/6502/olc6502';

function BusDeviceDummyUI({ instanceState }: { instanceState: BusDeviceDummy['state'] }) {
  return (
    <div>
      Start: {instanceState.startAddress}
      <div style={{ position: 'relative', width: 400, height: 400 * (102 / 227) }}>
        <Image src={'/static_assets/lcd/lcd.png'} alt="LCD device" fill={true} />
        <pre
          style={{
            position: 'absolute',
            top: 60,
            left: 50,
            width: 17,
            height: 28,
            background: 'red',
          }}
        >
          F
        </pre>
      </div>
    </div>
  );
}

export class BusDeviceDummy extends BusDeviceWithConstructor {
  static deviceType = 'Dummy';
  static pinsOccupied = 7;
  static hasUI = true;

  state: {
    startAddress: UInt16;
    endAddress: UInt16;
    instanceName: string;
  };

  constructor(bus: CpuMemoryBus, p: BusDeviceConstructorP, somethingSpecific: Date) {
    console.log(somethingSpecific);
    super(bus, p);
    this.state = {
      startAddress: this.startAddress,
      instanceName: this.instanceName,
      endAddress: this.endAddress,
    };
  }
  cpuRead(_address: UInt16) {
    return 0 as UInt8;
  }
  cpuWrite(_address: UInt16, _data: UInt8) {
    return true;
  }
  reset() {
    throw new Error('TODO: implement this');
  }

  override getUI() {
    return <BusDeviceDummyUI instanceState={this.state} />;
  }
}
