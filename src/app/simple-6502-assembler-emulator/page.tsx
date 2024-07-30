import React from 'react';
import { Emulator } from '@/app/simple-6502-assembler-emulator/emulator6502/Emulator';
import NotesMDX from './notes.mdx';
import { type Metadata } from 'next';
import { NewUserGreet } from '@/components/_organisms/NewUserGreet';

export const metadata: Metadata = {
  title: 'Marian-C - Simple 6002 based emulator and IDE',
  description:
    'Configuration 6502 based computer emulated in a browser. Load it up with compiled assembler code',
};

export default function PageSimple6502Emulator() {
  return (
    <>
      <NewUserGreet />
      <Emulator />
      <NotesMDX />
    </>
  );
}
