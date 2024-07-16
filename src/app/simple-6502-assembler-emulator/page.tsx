'use client';
import React from 'react';
import { Emulator } from '@/app/simple-6502-assembler-emulator/emulator6502/Emulator';
import NotesMDX from './notes.mdx';
export default function PageSimple6502Emulator() {
  return (
    <>
      <Emulator />
      <NotesMDX />
    </>
  );
}
