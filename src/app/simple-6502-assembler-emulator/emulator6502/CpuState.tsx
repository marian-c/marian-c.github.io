import React from 'react';
import type { EmulationDriver6502 } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import type { Bus } from '@/emulator/bus';
import { HexInput } from '@/components/HexInput/HexInput';

function CpuStateInner({ bus }: { bus: Bus }) {
  const cpu = bus.cpu;

  return (
    <div>
      A:{' '}
      <HexInput
        size={2}
        value={cpu.a}
        onChange={(v) => {
          console.log('new value', v);
        }}
        className="mr-2"
      />
      X:{' '}
      <HexInput
        size={2}
        value={cpu.x}
        onChange={(v) => {
          console.log('new value', v);
        }}
        className="mr-2"
      />
      Y:{' '}
      <HexInput
        size={2}
        value={cpu.y}
        onChange={(v) => {
          console.log('new value', v);
        }}
      />
      <br />
      PC:{' '}
      <HexInput
        className="mt-2"
        size={4}
        value={cpu.pc}
        onChange={(v) => {
          console.log('new value', v);
        }}
      />{' '}
      TODO: show disassembly info here, TODO: action to jump to assembler or disassembler or memory
      <br />
      SP:{' '}
      <HexInput
        className="mt-2"
        size={4}
        value={cpu.stkp}
        onChange={(v) => {
          console.log('new value', v);
        }}
      />
      TODO: action to jump memory region
      <br />
      Status:{' '}
      {cpu.status
        .toString(2)
        .split('')
        .map((n, idx) => {
          return <input className="ml-1" key={idx} type="checkbox" checked={n === '1'} readOnly />;
        })}
    </div>
  );
}

export const CpuState: React.FunctionComponent<{
  _driver: EmulationDriver6502;
  stateSignal: number;
}> = function ({ _driver }) {
  const bus = _driver.getBus();
  return bus ? <CpuStateInner bus={bus} /> : <div>Not ready</div>;
};
