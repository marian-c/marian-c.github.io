import React from 'react';
import { Anchor } from '@/components/_atoms/Anchor';
import Image from 'next/image';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marian-C',
  description: 'Emulators and tools',
};

export default function Home() {
  return (
    <main className="pb-3">
      <p>On this website:</p>
      <Anchor href="/simple-6502-assembler-emulator">
        <div className="bg-gradient-to-b from-gray-300 to-transparent relative">
          <Image
            className="border border-gray-400 opacity-45"
            src="/screenshots/emulator_2.png"
            alt="Screenshot of the emulator widget"
            width={1845}
            height={529}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 to-transparent text-center pt-3 text-xl font-bold">
            Simple 6502 assembler and emulator
          </div>
        </div>
      </Anchor>
    </main>
  );
}
