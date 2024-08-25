import React from 'react';
import type { EmulationDriver6502 } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import { HexInput } from '@/components/HexInput/HexInput';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';
import type { UInt16 } from '@/vendor-in/my-emulator/_/numbers';
import { disassembleNow } from '@/emulator/disassembler';
// TODO: show disassembly next to PC, TODO: action to jump to assembler or disassembler or memory
export function CpuState({
  locateAddress,
  _driver,
}: {
  _driver: EmulationDriver6502;
  locateAddress: (address: UInt16) => void;
}) {
  const cpu = _driver.getBus().cpu;

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
      SP:{' '}
      <HexInput
        className="mt-2"
        size={4}
        value={cpu.stkp}
        onChange={(v) => {
          console.log('new value', v);
        }}
      />
      <Button
        className="ml-2"
        title="Locate in memory"
        inaccessibleChildren={<Icon src="/static_assets/svg/crosshair.svg" />}
        onClick={() => {
          locateAddress((_driver.getBus().cpu.stkp + 0x0100) as UInt16);
        }}
      />
      <Button
        className="ml-2 hidden"
        title="Track location in memory"
        inaccessibleChildren={<Icon src="/static_assets/svg/crosshair_mega.svg" />}
        onClick={() => {
          // trackStackAddress()
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
      />
      <Button
        className="ml-2"
        title="Locate in memory"
        inaccessibleChildren={<Icon src="/static_assets/svg/crosshair.svg" />}
        onClick={() => {
          locateAddress(_driver.getBus().cpu.pc);
        }}
      />
      <br />
      {disassembleNow(_driver.getBus())}
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
