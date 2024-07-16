import React, { type Dispatch, type SetStateAction } from 'react';
import { Box } from '@/components/box/box';
import { CpuState } from '@/app/simple-6502-assembler-emulator/emulator6502/CpuState';
import { tableCN, textInputCN } from '@/app/classnames';
import { RomSection } from '@/app/simple-6502-assembler-emulator/emulator6502/RomSection';
import type {
  EmulationDriver6502,
  SourceCompiledStatus,
  SourceLoadedStatus,
} from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import type { RomInformation } from '@/app/simple-6502-assembler-emulator/emulator6502/types';

export const SideBar: React.FunctionComponent<{
  _driver: EmulationDriver6502;
  stateSignal: number;
  // speed
  speed: number;
  setSpeed: Dispatch<SetStateAction<number>>;
  // emulation state
  running: boolean;
  setRunning: Dispatch<SetStateAction<boolean>>;
  // rom section
  romDetails: RomInformation;
  setRomDetails: Dispatch<SetStateAction<RomInformation>>;
  // source section
  sourceCompiledStatus: SourceCompiledStatus;
  sourceLoadedStatus: SourceLoadedStatus;
}> = ({
  stateSignal,
  _driver,
  speed,
  setSpeed,
  running,
  setRunning,
  romDetails,
  setRomDetails,
  sourceCompiledStatus,
  sourceLoadedStatus,
}) => {
  const state = React.useMemo(() => {
    return {
      stateSignal,
      calculatedSpeedInHz: _driver.calculatedSpeedInHz,
    };
  }, [_driver.calculatedSpeedInHz, stateSignal]);
  return (
    <>
      <Box
        header={<div className="bg-gradient-to-b from-pane-background to-amber-100">State</div>}
        className="mb-4 border-r-0 bg-amber-100"
      >
        <CpuState _driver={_driver} stateSignal={stateSignal} />
      </Box>

      {_driver.getBus().attachedDevices.map((attachedDevice) => {
        const uiEl = attachedDevice.getUI();
        if (!uiEl) {
          return null;
        }
        return (
          <Box
            key={attachedDevice.instanceId}
            header={attachedDevice.instanceName}
            className="mb-4 border-r-0"
          >
            {uiEl}
          </Box>
        );
      })}

      <Box header={'About'} className="mb-4 border-r-0">
        Cpu: 6502 <br />
        Emulation: Documented instructions blah blah blah
        <br />
        Available Memory: 64k <br />
      </Box>

      <Box header="config" className="mb-4 border-r-0">
        Target speed:{' '}
        <input
          className={textInputCN}
          type="number"
          value={speed}
          onChange={() => {
            console.info('TODO');
          }}
        />{' '}
        <input
          type="range"
          value={speed}
          min={0}
          max={1_000_000}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            _driver.setSpeed(num);
            setSpeed(num);
          }}
        />
      </Box>
      <Box header="Status" className="mb-4 border-r-0">
        Running: {running ? 'yes' : 'no'}
        <br />
        Speed: {state.calculatedSpeedInHz}
      </Box>
      <Box header="Source" className="mb-4 border-r-0">
        <table className={tableCN}>
          <tbody>
            <tr>
              <td className="">Compiled</td>
              <td className={sourceCompiledStatus === 'errors' ? 'text-red-500' : ''}>
                {sourceCompiledStatus}
              </td>
            </tr>
            <tr>
              <td className="">Loaded</td>
              <td className="">{sourceLoadedStatus}</td>
            </tr>
          </tbody>
        </table>
      </Box>
      <Box header="ROM" className="mb-4 border-r-0">
        <RomSection
          currentRom={romDetails}
          setCurrentRom={(details) => {
            setRomDetails(details);
            _driver.stop();
            setRunning(false);
            _driver.setRom(details);
          }}
        />
      </Box>
    </>
  );
};
