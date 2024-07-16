import { textLinkCN } from '@/app/classnames';

export default function PageEmulatorPerformanceTests() {
  return (
    <div className="p-2">
      <h2 className="font-bold text-xl mt-2 mb-1">Emulator Performance Tests</h2>

      <p>
        On this page you can race various 6502 emulators and see which is the fastest. Numbers
        don&apos;t mean a lot but I use this to inform further optimisation efforts.
      </p>

      <h3 className="font-bold text-lg mt-2 mb-1">Emulators tested</h3>
      <h4 className="font-bold mt-2 mb-1">Easy 6502</h4>
      <p>
        <a className={textLinkCN} href="https://twitter.com/skilldrick">
          Nick Morgan
        </a>{' '}
        (aka{' '}
        <a className={textLinkCN} href="https://github.com/skilldrick">
          skilldrick
        </a>{' '}
        on Github) has build{' '}
        <a className={textLinkCN} href="https://skilldrick.github.io/easy6502/">
          Easy 6502
        </a>{' '}
        where he uses his own emulator{' '}
        <a className={textLinkCN} href="https://github.com/skilldrick/6502js">
          6502js
        </a>
        . Note that the standalone emulator project might have{' '}
        <a className={textLinkCN} href="https://github.com/skilldrick/6502js/issues/4">
          diverged
        </a>{' '}
        from the one used on the Easy 6502 project.
      </p>
      <p>
        I&apos;ve modified his emulator, leaving only the CPU emulator features, search for
        &quot;vendor-in/skilldrick-6502js/assembler-debug&quot;
      </p>

      <h3 className="font-bold text-lg mt-2 mb-1">Emulation process</h3>
      <p>
        For each emulator, I&apos;m running Klaus&apos;s tests 10 times, the result is the total
        time for the 10 runs
      </p>

      <h3 className="font-bold text-lg mt-2 mb-1">My results</h3>
      <p>TODO</p>

      <h3 className="font-bold text-lg mt-2 mb-1">Run it yourself</h3>
      <p>
        This will run on the main loop, avoid interacting with your computer for best results. If
        you have issues running this, please file a Github issue
      </p>
    </div>
  );
}
