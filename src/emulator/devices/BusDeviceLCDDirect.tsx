import React from 'react';
import { BusDeviceWithConstructor } from '@/emulator/BusDeviceWithConstructor';
import { type UInt16, type UInt8 } from '@/vendor-in/my-emulator/_/numbers';
import Image from 'next/image';
import type { BusDeviceConstructorP } from '@/emulator/types';
import { type CpuMemoryBus } from '@/vendor-in/my-emulator/6502/olc6502';

type State = BusDeviceLCDDirect['state'];
function BusDeviceLCDDirectUI({ componentState }: { componentState: State }) {
  return (
    <div>
      <div
        style={{ position: 'relative', aspectRatio: '227 / 102', marginLeft: -8, marginRight: -8 }}
      >
        <Image src={'/static_assets/lcd/lcd.png'} alt="LCD device" fill={true} />
        <pre
          className="text-lg"
          style={{
            position: 'absolute',
            top: 45,
            left: 37,
            width: 13,
            height: 21,
            letterSpacing: '1.8px',
            fontSize: '1.3rem',
            lineHeight: '1.45rem',
          }}
        >
          {componentState.characters.map((c) => String.fromCharCode(c))}
        </pre>
      </div>
    </div>
  );
}

export class BusDeviceLCDDirect extends BusDeviceWithConstructor {
  static deviceType = 'LCD';
  static pinsOccupied = 3;
  static hasUI = true;

  previousAddress: number = 0;
  previousData: number = 0;

  state: {
    characters: number[];
  };

  constructor(bus: CpuMemoryBus, p: BusDeviceConstructorP) {
    super(bus, p);
    this.state = {
      characters: [],
    };
  }
  cpuRead(_address: UInt16) {
    return 0 as UInt8;
  }
  cpuWrite(address: UInt16, data: UInt8) {
    const isEnabled = !!(address & 0b1);
    const wasEnabled = !!(this.previousAddress & 0b1);

    const isData = !!(this.previousAddress & 0b010);
    const isRead = !!(this.previousAddress & 0b100);

    if (!isEnabled && wasEnabled) {
      // takes effect, but what

      if (!isData && !isRead) {
        // write an instruction
        this.writeInstruction(this.previousData);
      }

      if (isData && !isRead) {
        // write data
        this.writeData(this.previousData);
      }
    }

    if (isEnabled) {
      this.previousAddress = address;
      this.previousData = data;
    } else {
      this.previousAddress = 0;
      this.previousData = 0;
    }

    return true;
  }

  writeInstruction(data: number) {
    if (!!(data & 0b0010_0000)) {
      // function set, but we don't support anything but the default for now
    }
    if (!!(data & 0b0000_1000)) {
      // display control
    }
    if (!!(data & 0b0000_0100)) {
      // entry mode set
    }
  }

  writeData(data: number) {
    this.state.characters.push(data);
  }

  reset() {
    this.previousAddress = 0;
    this.previousData = 0;

    this.state.characters = [];
  }

  override getUI() {
    return <BusDeviceLCDDirectUI componentState={this.state} />;
  }
}
