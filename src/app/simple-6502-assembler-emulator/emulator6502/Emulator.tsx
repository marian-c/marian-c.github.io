import React from 'react';
import { Pane } from '@/components/pane/pane';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';
import type {
  DisplayMode,
  RomInformation,
  SourceCompiledStatus,
  SourceLoadedStatus,
} from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import { Tabs } from '@/components/tabs/tabs';
import { assertIsDefined, assertNever } from '@/utils';
import { SpaceHorizontal } from '@/components/space-horizontal/space-horizontal';
import { View } from '@/components/view/view';
import { Overflow } from '@/components/overflow/overflow';
import { BusMonitor } from '@/app/simple-6502-assembler-emulator/emulator6502/BusMonitor';
import { CpuState } from '@/app/simple-6502-assembler-emulator/emulator6502/CpuState';
import {
  Editor,
  type EditorHandleRef,
} from '@/app/simple-6502-assembler-emulator/emulator6502/Editor/Editor';
import { SideBar } from '@/app/simple-6502-assembler-emulator/emulator6502/SideBar';
import { compile } from '@/mcw6502compiler/compiler';
import { instructionMatrixToInfo } from '@/mcw6502compiler/instructionMatrixToInfo';
import { lookup } from '@/vendor-in/my-emulator/6502/olc6502_lookup';
import { GenericResultKind } from '@/types';
import { PreferencesButton } from '@/app/simple-6502-assembler-emulator/emulator6502/PreferencesButton';
import { defaultComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/utils';
import { localStorageSimpleGet, localStorageSimpleSet } from '@/helpers/window/localStorageSimple';
import { IntervalDriver } from '@/app/simple-6502-assembler-emulator/emulator6502/driver/internalDriver';

type TabKeys = 'system-editor' | 'system-busMonitor' | 'system-log';

let initialComputerConfiguration =
  localStorageSimpleGet('simple_6502_emulator_computer_configuration') ||
  defaultComputerConfiguration;

const emptyRom = {
  size: 0x10000,
  initialPc: 0,
  startingAddress: 0,
  contents: new Uint8Array(new Array(0x10000).fill(0)),
};

const _driver = new IntervalDriver(emptyRom, initialComputerConfiguration);

export const Emulator: React.FunctionComponent<{}> = ({}) => {
  const [running, setRunning] = React.useState(false);

  const [speed, setSpeed] = React.useState(65);

  const [stateSignal, setStateSignal] = React.useState(0);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKeys>('system-busMonitor');
  const [activeTabKey2, setActiveTabKey2] = React.useState<TabKeys>('system-log');

  const [displayMode, setDisplayMode] = React.useState<DisplayMode>('normal');

  const [romDetails, setRomDetails] = React.useState<RomInformation>({
    type: 'empty',
    description: 'zeroed out',
    ...emptyRom,
  });

  const [computerConfiguration, setComputerConfiguration] = React.useState(
    initialComputerConfiguration,
  );

  const [sourceCompiledStatus, setSourceCompiledStatus] =
    React.useState<SourceCompiledStatus>('outdated');
  const [sourceLoadedStatus, setSourceLoadedStatus] =
    React.useState<SourceLoadedStatus>('outdated');

  const editorHandleRef = React.useRef<EditorHandleRef>(null);

  let sizeIcon = '/svg/maximize.svg';
  let fixedHeight = false;
  let showSecondPane = false;
  switch (displayMode) {
    case 'max':
      sizeIcon = '/svg/minimize.svg';
      fixedHeight = true;
      showSecondPane = true;
      break;
    case 'normal':
      sizeIcon = '/svg/maximize.svg';
      break;
    default:
      assertNever(displayMode);
  }

  const isSourceActive =
    activeTabKey === 'system-editor' || (showSecondPane && activeTabKey2 === 'system-editor');

  React.useEffect(() => {
    _driver.setSpeed(speed);
    return _driver.onStateSignalChange((newState) => {
      setStateSignal(newState);
    }, 60);
  }, [speed]);

  // TODO: make this position fixed and make the body overflow hidden to prevent scrolling of the background
  const wrapperCN =
    displayMode === 'normal'
      ? 'min-h-[700px]'
      : 'absolute left-0 top-0 right-0 bottom-0  overflow-auto';
  return (
    <Pane
      className={`${wrapperCN}`}
      full
      header={<h1 className="font-bold">Simple 6502 assembler and emulator</h1>}
      headerButtons={[
        <Button
          key="display-mode"
          title="Maximize this panel"
          inaccessibleChildren={<Icon src={sizeIcon} />}
          onClick={() => {
            setDisplayMode((oldDisplayMode) => {
              switch (oldDisplayMode) {
                case 'normal':
                  return 'max';
                case 'max':
                  return 'normal';
                default:
                  return assertNever(oldDisplayMode);
              }
            });
          }}
        />,
        <SpaceHorizontal key="space-after-display-mode" />,
        <PreferencesButton
          key="preferences"
          initialConfiguration={computerConfiguration}
          onConfigurationChange={(newConfiguration) => {
            initialComputerConfiguration = newConfiguration;
            localStorageSimpleSet('simple_6502_emulator_computer_configuration', newConfiguration);
            setComputerConfiguration(newConfiguration);
            setRunning(false);
            _driver.stop();
            _driver.setConfiguration(emptyRom, newConfiguration);
            setRomDetails({
              type: 'empty',
              description: 'zeroed out',
              ...emptyRom,
            });
            setSourceLoadedStatus('outdated');
          }}
        />,
      ]}
    >
      <div className="p-2">
        <Button
          className="mr-2"
          disabled={running || romDetails.type === 'empty'}
          title="Start/continue execution"
          inaccessibleChildren={<Icon src={running ? '/svg/play-disabled.svg' : '/svg/play.svg'} />}
          onClick={
            running
              ? undefined
              : () => {
                  _driver.start();
                  setRunning(true);
                }
          }
        />
        <Button
          className="mr-2"
          disabled={!running}
          title="Pause execution"
          inaccessibleChildren={
            <Icon src={running ? '/svg/pause.svg' : '/svg/pause-disabled.svg'} />
          }
          onClick={
            !running
              ? undefined
              : () => {
                  setRunning(false);
                  _driver.stop();
                }
          }
        />
        <Button
          className="mr-2"
          disabled={!isSourceActive}
          inaccessibleChildren={<Icon src="/svg/build.svg" />}
          title="Build source"
          onClick={() => {
            assertIsDefined(editorHandleRef.current);
            const source = editorHandleRef.current.getSourceString();
            const result = compile(source, { instructionsInfo: instructionMatrixToInfo(lookup) });
            if (result.kind === GenericResultKind.error) {
              setSourceCompiledStatus('errors');
              editorHandleRef.current.setCompilationErrors(result.errors);
            } else {
              setSourceCompiledStatus('yes');
              editorHandleRef.current.setCompilationErrors([]);
            }
          }}
        />
        <Button
          className="mr-2"
          disabled={!isSourceActive}
          inaccessibleChildren={<Icon src="/svg/build-load.svg" />}
          title="Build and load into memory"
          onClick={() => {
            assertIsDefined(editorHandleRef.current);
            const source = editorHandleRef.current.getSourceString();
            const result = compile(source, { instructionsInfo: instructionMatrixToInfo(lookup) });
            if (result.kind === GenericResultKind.error) {
              setSourceCompiledStatus('errors');
              editorHandleRef.current.setCompilationErrors(result.errors);
            } else {
              editorHandleRef.current.setCompilationErrors([]);
              const contents = result.result;
              const romInformation: RomInformation = {
                startingAddress: contents.startAddress,
                initialPc: null,
                description: '[compiled from source]',
                type: 'compiled',
                contents: contents.data,
                size: contents.data.byteLength,
              };
              setRomDetails(romInformation);
              setRunning(false);
              _driver.stop();
              _driver.setRom(romInformation);
              setSourceCompiledStatus('yes');
              setSourceLoadedStatus('yes');
            }
          }}
        />
        <Button
          className="mr-2"
          disabled={!isSourceActive}
          inaccessibleChildren={<Icon src="/svg/build-run.svg" />}
          title="Build and run"
          onClick={() => {
            assertIsDefined(editorHandleRef.current);
            const source = editorHandleRef.current.getSourceString();
            const result = compile(source, { instructionsInfo: instructionMatrixToInfo(lookup) });
            if (result.kind === GenericResultKind.error) {
              setSourceCompiledStatus('errors');
              editorHandleRef.current.setCompilationErrors(result.errors);
            } else {
              editorHandleRef.current.setCompilationErrors([]);
              const contents = result.result;
              const romInformation: RomInformation = {
                startingAddress: contents.startAddress,
                initialPc: null,
                description: '[compiled from source]',
                type: 'compiled',
                contents: contents.data,
                size: contents.data.byteLength,
              };
              setRomDetails(romInformation);
              _driver.stop();
              _driver.setRom(romInformation);
              _driver.start();
              setRunning(true);
              setSourceCompiledStatus('yes');
              setSourceLoadedStatus('yes');
            }
          }}
        />
        <Button
          className="mr-2"
          inaccessibleChildren={<Icon src="/svg/reset.svg" />}
          title="Reset Computer"
          onClick={() => {
            setRunning(false);
            _driver.stop();
            _driver.reset();
          }}
        />
        <Button
          className="mr-2"
          inaccessibleChildren={<Icon src="/svg/reload.svg" />}
          title="Reload rom"
          onClick={() => {
            setRunning(false);
            _driver.stop();
            _driver.reload();
          }}
        />
      </div>
      <View grow horizontal>
        <Tabs<TabKeys>
          grow
          wrapperCN={'mr-2 flex-1'}
          contentWrapperCN="border-l-0"
          activeTabKey={activeTabKey}
          _onActiveTabChange={(newValue) => {
            if (activeTabKey2 === newValue) {
              setActiveTabKey2(activeTabKey);
            }
            setActiveTabKey(newValue);
          }}
          tabs={[
            {
              key: 'system-editor',
              header: 'Compiler',
              content: (
                <Editor
                  handleRef={editorHandleRef}
                  onChange={() => {
                    setSourceCompiledStatus('outdated');
                    setSourceLoadedStatus('outdated');
                  }}
                />
              ),
            },
            {
              key: 'system-busMonitor',
              header: 'Bus Monitor',
              content: <BusMonitor _driver={_driver} stateSignal={stateSignal}></BusMonitor>,
            },
            {
              key: 'system-log',
              header: 'Log',
              content: (
                <Overflow vertical={fixedHeight} horizontal>
                  <div className="h-[2000px] w-[2000px] bg-amber-100">
                    <CpuState _driver={_driver} stateSignal={stateSignal} />
                    {stateSignal}
                  </div>
                </Overflow>
              ),
            },
            // TODO: show the (only) tab if any of the attached devices has UI
            // ...(_driver.getBus()?.attachedDevices.map((device) => {
            //   const deviceConfig = Object.entries(possibleDevices).find((conf) => {
            //     return device instanceof conf[1];
            //   });
            //   if (!deviceConfig) {
            //     throw new ErrorShouldNotHappen();
            //   }
            //   const deviceName = deviceConfig[0] as PossibleDevices;
            //
            //   return {
            //     key: deviceName,
            //     header: deviceName,
            //     content: device.getOutput(),
            //   };
            // }) || []),
          ]}
        />
        {showSecondPane ? (
          <Tabs<TabKeys>
            grow
            wrapperCN={'mr-2 flex-1'}
            activeTabKey={activeTabKey2}
            _onActiveTabChange={(newValue) => {
              if (activeTabKey === newValue) {
                setActiveTabKey(activeTabKey2);
              }
              setActiveTabKey2(newValue);
            }}
            tabs={[
              {
                key: 'system-editor',
                header: 'Compiler',
                content: (
                  <Editor
                    handleRef={editorHandleRef}
                    onChange={() => {
                      setSourceCompiledStatus('outdated');
                      setSourceLoadedStatus('outdated');
                    }}
                  />
                ),
              },
              {
                key: 'system-busMonitor',
                header: 'Bus Monitor',
                content: <BusMonitor _driver={_driver} stateSignal={stateSignal}></BusMonitor>,
              },
              {
                key: 'system-log',
                header: 'Log',
                content: (
                  <Overflow vertical={fixedHeight} horizontal>
                    <div className="h-[2000px] w-[2000px] bg-amber-100">
                      <CpuState _driver={_driver} stateSignal={stateSignal} />
                      {stateSignal}
                    </div>
                  </Overflow>
                ),
              },
            ]}
          />
        ) : null}
        <View className="w-[300px]">
          <Overflow vertical={fixedHeight}>
            <SideBar
              stateSignal={stateSignal}
              _driver={_driver}
              running={running}
              setRunning={setRunning}
              speed={speed}
              setSpeed={setSpeed}
              romDetails={romDetails}
              setRomDetails={(newRomDetails) => {
                setSourceLoadedStatus('outdated');
                setRomDetails(newRomDetails);
              }}
              sourceCompiledStatus={sourceCompiledStatus}
              sourceLoadedStatus={sourceLoadedStatus}
            />
          </Overflow>
        </View>
      </View>
    </Pane>
  );
};
