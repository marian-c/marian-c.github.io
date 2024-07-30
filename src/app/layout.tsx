import type { Metadata } from 'next';
import './globals.css';
import { H3 } from '../components/_atoms/H';
import { Anchor } from '@/components/_atoms/Anchor';
import { config } from '@/config';
import { SiteHeader } from '@/components/_sections/SiteHeader';
import { ToastDestination } from '@/components/_helpers/toast';

export const metadata: Metadata = {
  title: 'Marian-C',
  description: 'Emulators and tools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <div className="flex flex-col bg-white max-w-5xl min-h-[100vh] m-auto">
          <div className="flex-grow p-2">
            <SiteHeader />
            {children}
          </div>
          <footer className="flex-shrink-0 bg-amber-100 p-2 flex flex-wrap">
            <div className="flex-auto min-w-[300px]">
              <H3>Emulators</H3>
              <menu>
                <li>
                  <Anchor href="/simple-6502-assembler-emulator">Simple 6502</Anchor>
                </li>
              </menu>
            </div>

            <div className="flex-auto min-w-[300px]">
              <H3>Meta</H3>
              <menu>
                <li>
                  <Anchor href="/about">About</Anchor>
                </li>
                <li>
                  <Anchor href={config.githubRepository}>Github</Anchor>
                </li>
              </menu>
            </div>
          </footer>
        </div>
        <ToastDestination />
      </body>
    </html>
  );
}
