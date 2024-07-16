import React from 'react';
import { Anchor } from '@/components/_atoms/Anchor';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="pb-3">
      <p>On this website:</p>
      <Anchor href="/simple-6502-assembler-emulator">
        <div className="bg-gradient-to-b from-gray-300 to-transparent relative">
          <Image
            className="border border-gray-400 opacity-45"
            src="/screenshots/emulator.png"
            alt="Screenshot of the emulator widget"
            width={1918}
            height={513}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 to-transparent text-center pt-3 text-xl font-bold">
            Simple 6502 assembler and emulator
          </div>
        </div>
      </Anchor>
    </main>
  );
}
