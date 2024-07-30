'use client';
import React, { type ComponentProps } from 'react';
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
import { defaultComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/utils';
import { localStorageSimpleGet, localStorageSimpleSet } from '@/helpers/window/localStorageSimple';
import { IntervalDriver } from '@/app/simple-6502-assembler-emulator/emulator6502/driver/internalDriver';
import { LayoutSpread } from '@/components/_layouts/LayoutSpread';
import { Preferences } from '@/app/simple-6502-assembler-emulator/emulator6502/Preferences';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/_helpers/tooltip';
import { config } from '@/config';

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
  const [$running, _setRunning] = React.useState(false);
  const [stoppedBecause, _setStoppedBecause] = React.useState('');
  const startRunning = function () {
    _setRunning(true);
    _setStoppedBecause('');
  };
  const $stopRunning = React.useCallback(
    function (reason: string) {
      _setRunning(false);
      if ($running) {
        _setStoppedBecause(reason);
      } else {
        _setStoppedBecause('');
      }
    },
    [$running],
  );

  const [isPreferencesOpen, setIsPreferencesOpen] = React.useState(false);

  const $onNewPreferences = React.useCallback<ComponentProps<typeof Preferences>['$onDone']>(
    (newComputerConfiguration) => {
      setIsPreferencesOpen(false);
      if (newComputerConfiguration !== null) {
        // cache the value for next time this mounts
        initialComputerConfiguration = newComputerConfiguration;
        // cache the value for next time browser refreshes
        localStorageSimpleSet(
          'simple_6502_emulator_computer_configuration',
          newComputerConfiguration,
        );
        // cache the value for next time preferences open
        setComputerConfiguration(newComputerConfiguration);

        $stopRunning('config change');
        _driver.stop();
        _driver.setConfiguration(emptyRom, newComputerConfiguration);
        setRomDetails({
          type: 'empty',
          description: 'zeroed out',
          ...emptyRom,
        });
        setSourceLoadedStatus('outdated');
      }
    },
    [$stopRunning],
  );

  const [speed, setSpeed] = React.useState(65);

  const [stateSignal, setStateSignal] = React.useState(0);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKeys>('system-editor');
  const [activeTabKey2, setActiveTabKey2] = React.useState<TabKeys>('system-busMonitor');

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

  // region: set no scroll when transitioning to 'max', remove otherwise and when unmounting
  React.useEffect(() => {
    return () => {
      document.body.classList.remove('noscroll');
    };
  }, []);
  React.useEffect(() => {
    if (displayMode === 'max') {
      document.body.classList.add('noscroll');
    } else {
      document.body.classList.remove('noscroll');
    }
  }, [displayMode]);
  // endregion

  // TODO: make this position fixed and make the body overflow hidden to prevent scrolling of the background
  const wrapperCN =
    displayMode === 'normal' ? '' : 'absolute left-0 top-0 right-0 bottom-0  overflow-auto';

  let disabledReasonStart: string | null = null;
  if ($running) {
    disabledReasonStart = 'The emulation is running';
  }
  if (romDetails.type === 'empty') {
    disabledReasonStart = "There's nothing to run, the ROM is empty";
  }

  const buttons = (
    <>
      <Tooltip delay={config.disabledButtonsTooltipDelay}>
        <TooltipTrigger asChild>
          <Button
            className="mr-2"
            disabled={!!disabledReasonStart}
            title={disabledReasonStart === null ? 'Start/continue execution' : undefined}
            inaccessibleChildren={
              <Icon src={$running ? '/svg/play-disabled.svg' : '/svg/play.svg'} />
            }
            onClick={
              $running
                ? undefined
                : () => {
                    _driver.start();
                    startRunning();
                  }
            }
          />
        </TooltipTrigger>
        {disabledReasonStart && <TooltipContent>{disabledReasonStart}</TooltipContent>}
      </Tooltip>

      <Tooltip delay={config.disabledButtonsTooltipDelay}>
        <TooltipTrigger asChild>
          <Button
            className="mr-2"
            disabled={!$running}
            title={!$running ? undefined : 'Pause execution'}
            inaccessibleChildren={
              <Icon src={$running ? '/svg/pause.svg' : '/svg/pause-disabled.svg'} />
            }
            onClick={
              !$running
                ? undefined
                : () => {
                    $stopRunning('paused');
                    _driver.stop();
                  }
            }
          />
        </TooltipTrigger>
        {!$running && <TooltipContent>The emulation is paused</TooltipContent>}
      </Tooltip>
      <Tooltip delay={config.disabledButtonsTooltipDelay}>
        <TooltipTrigger asChild>
          <Button
            className="mr-2"
            disabled={!isSourceActive}
            inaccessibleChildren={<Icon src="/svg/build.svg" />}
            title={!isSourceActive ? undefined : 'Build source'}
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
        </TooltipTrigger>
        {!isSourceActive && <TooltipContent>Activate the compiler tab first</TooltipContent>}
      </Tooltip>

      <Tooltip delay={config.disabledButtonsTooltipDelay}>
        <TooltipTrigger asChild>
          <Button
            className="mr-2"
            disabled={!isSourceActive}
            inaccessibleChildren={<Icon src="/svg/build-load.svg" />}
            title={!isSourceActive ? undefined : 'Build and load into memory'}
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
                $stopRunning('load from source');
                _driver.stop();
                _driver.setRom(romInformation);
                setSourceCompiledStatus('yes');
                setSourceLoadedStatus('yes');
              }
            }}
          />
        </TooltipTrigger>
        {!isSourceActive && <TooltipContent>Activate the compiler tab first</TooltipContent>}
      </Tooltip>

      <Tooltip delay={config.disabledButtonsTooltipDelay}>
        <TooltipTrigger asChild>
          <Button
            className="mr-2"
            disabled={!isSourceActive}
            inaccessibleChildren={<Icon src="/svg/build-run.svg" />}
            title={!isSourceActive ? undefined : 'Build and run'}
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
                startRunning();
                setSourceCompiledStatus('yes');
                setSourceLoadedStatus('yes');
              }
            }}
          />
        </TooltipTrigger>
        {!isSourceActive && <TooltipContent>Activate the compiler tab first</TooltipContent>}
      </Tooltip>
      <Button
        className="mr-2"
        inaccessibleChildren={<Icon src="/svg/reset.svg" />}
        title="Reset Computer"
        onClick={() => {
          $stopRunning('reset');
          _driver.stop();
          _driver.reset();
        }}
      />
      <Button
        className="mr-2"
        inaccessibleChildren={<Icon src="/svg/reload.svg" />}
        title="Reload rom"
        onClick={() => {
          $stopRunning('reload');
          _driver.stop();
          _driver.reload();
        }}
      />
    </>
  );

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
        <React.Fragment key="preferences">
          <Button
            title="Open the preferences pane"
            inaccessibleChildren={<Icon src={'/svg/preferences.svg'} />}
            onClick={() => {
              setIsPreferencesOpen(true);
            }}
          />
          {isPreferencesOpen && (
            <Preferences
              $onDone={$onNewPreferences}
              initialComputerConfiguration={computerConfiguration}
            />
          )}
        </React.Fragment>,
      ]}
    >
      <LayoutSpread useChild>
        <div className="p-2">
          {buttons}
          <span>
            Running: {$running ? 'yes' : 'no'}
            {stoppedBecause && ` (${stoppedBecause})`}
          </span>
        </div>
      </LayoutSpread>

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
                <Overflow vertical horizontal>
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
              running={$running}
              stopRunning={$stopRunning}
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
