import { Icon } from '@/components/icon/icon';
import { Button } from '@/components/Button/Button';
import React from 'react';
import { Pane } from '@/components/pane/pane';
import type { DeviceConfig, PossibleDevicesStrings } from '@/emulator/bus';
import { busDeviceParams, possibleDevices } from '@/emulator/bus';
import { HexInput } from '@/components/HexInput/HexInput';
import { HexNumber } from '@/components/HexNumber/HexNumber';
import { Box } from '@/components/box/box';
import type { UInt16 } from '@/vendor-in/my-emulator/_/numbers';
import { v4 as uuidv4 } from 'uuid';
import { assertNever } from '@/utils';
import { hex } from '@/helpers/numbers';
import type { ComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import { defaultComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/utils';

export function PreferencesButton({
  initialConfiguration,
  onConfigurationChange,
}: {
  initialConfiguration: ComputerConfiguration;
  onConfigurationChange: (newConfiguration: ComputerConfiguration) => void;
}) {
  const preferencesDialogRef = React.useRef<HTMLDialogElement>(null);
  const [computerConfiguration, setComputerConfiguration] =
    React.useState<ComputerConfiguration>(initialConfiguration);

  React.useMemo(() => {
    setComputerConfiguration(initialConfiguration);
  }, [initialConfiguration]);

  const [selectedDeviceForNew, setSelectedDeviceForNew] =
    React.useState<PossibleDevicesStrings | null>(null);
  const [errors, setErrors] = React.useState<Record<number, boolean>>({});

  const ranges = computerConfiguration.busConfiguration.devices.map((device) => {
    const DeviceClass = possibleDevices[device.name];
    const pins = DeviceClass.pinsOccupied;
    const start = device.params[0].startAddress;
    const end = start + 2 ** pins;
    return [start, end] as const;
  });
  const hasConflict = ranges.some((range) => {
    return ranges.some((range2) => {
      if (range === range2) {
        return false;
      }
      return (
        (range[0] >= range2[0] && range[0] <= range2[1]) ||
        (range[1] >= range2[0] && range[1] <= range2[1])
      );
    });
  });

  const hasErrors = hasConflict || Object.values(errors).some((e) => e);
  return (
    <>
      <Button
        title="Open the preferences pane"
        inaccessibleChildren={<Icon src={'/svg/preferences.svg'} />}
        onClick={() => {
          preferencesDialogRef.current?.showModal();
        }}
      />
      <dialog ref={preferencesDialogRef}>
        <Pane
          header="Configure your computer"
          className="w-[500px] overflow-auto"
          contentClassName="p-2 pt-6"
          headerButtons={[
            <Button
              className="ml-5"
              key="close-button"
              onClick={() => {
                preferencesDialogRef.current?.close();
              }}
            >
              <Icon src="/svg/close.svg" />{' '}
            </Button>,
          ]}
        >
          <div className="">
            Saving this dialog will reset the CPU and clear the ROM contents. The source file will
            remain intact.
            {computerConfiguration.busConfiguration.devices.map((device) => {
              const DeviceClass = possibleDevices[device.name];
              const pins = DeviceClass.pinsOccupied;
              const size = pins ** 2;
              const { instanceName, startAddress } = device.params[0];
              return (
                <div key={device.id}>
                  <Box
                    header={`${instanceName} (${device.name} ${pins} ${pins === 1 ? 'pin' : 'pins'}) `}
                    className="mt-4"
                  >
                    <p className="mt-4">
                      0 &le;{' '}
                      <HexInput
                        size={4}
                        onError={() => {
                          setErrors({ ...errors, [device.id]: true });
                        }}
                        value={startAddress}
                        min={0}
                        max={0xffff - size + 1}
                        onChange={(v) => {
                          setErrors({ ...errors, [device.id]: false });
                          setComputerConfiguration({
                            ...computerConfiguration,
                            busConfiguration: {
                              ...computerConfiguration.busConfiguration,
                              devices: computerConfiguration.busConfiguration.devices.map((d) => {
                                if (d.id === device.id) {
                                  switch (d.name) {
                                    case 'BusDeviceDummy': {
                                      const data = d as DeviceConfig<'BusDeviceDummy'>;
                                      const [_, ...rest] = data.params;
                                      return {
                                        ...data,
                                        params: [
                                          {
                                            instanceName: `${DeviceClass.deviceType} at ${hex(4, '0x', v)}`,
                                            startAddress: v as UInt16,
                                            instanceId: device.id,
                                          },
                                          ...rest,
                                        ],
                                      };
                                    }
                                    case 'BusDeviceLCDDirect': {
                                      const data = d as DeviceConfig<'BusDeviceLCDDirect'>;
                                      const [_, ...rest] = data.params;
                                      return {
                                        ...data,
                                        params: [
                                          {
                                            instanceId: device.id,
                                            instanceName: `${DeviceClass.deviceType} at ${hex(4, '0x', v)}`,
                                            startAddress: v as UInt16,
                                          },
                                          ...rest,
                                        ],
                                      };
                                    }
                                    default:
                                      assertNever(d.name);
                                  }
                                }
                                return d;
                              }),
                            },
                          });
                        }}
                      />{' '}
                      &ndash; <HexNumber value={startAddress + size - 1} use="hex" /> &le;{' '}
                      <HexNumber value={0xffff} use="hex" />
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setComputerConfiguration({
                          ...computerConfiguration,
                          busConfiguration: {
                            ...computerConfiguration.busConfiguration,
                            devices: computerConfiguration.busConfiguration.devices.filter((d) => {
                              return d.id !== device.id;
                            }),
                          },
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </div>
              );
            })}
            {hasConflict && <p className="p-2 text-red-500">Error: device address space overlap</p>}
            <p className="p-1 mt-4">
              <select
                value={selectedDeviceForNew || ''}
                className="p-1"
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedDeviceForNew(v === '0' ? null : (v as PossibleDevicesStrings));
                }}
              >
                <option value="0">Select new device</option>
                {Object.entries(possibleDevices).map(([key, DeviceClass]) => {
                  return (
                    <option key={key} value={key}>
                      {DeviceClass.deviceType}
                    </option>
                  );
                })}
              </select>
              <Button
                onClick={() => {
                  if (selectedDeviceForNew === null) {
                    return;
                  }

                  let params;

                  const DeviceClass = possibleDevices[selectedDeviceForNew];
                  const lastOccupiedAddress = computerConfiguration.busConfiguration.devices.reduce(
                    (acc, device) => {
                      const DeviceClass = possibleDevices[device.name];
                      const pins = DeviceClass.pinsOccupied;
                      const startAddress = device.params[0].startAddress;
                      const end = startAddress + 2 ** pins;
                      return end > acc ? end : acc;
                    },
                    0x5fff,
                  );
                  const nextFreeAddress = lastOccupiedAddress + 1;
                  const id = uuidv4();
                  switch (selectedDeviceForNew) {
                    case 'BusDeviceLCDDirect':
                      params = busDeviceParams<'BusDeviceLCDDirect'>(id, selectedDeviceForNew, [
                        {
                          instanceId: id,
                          startAddress: nextFreeAddress as UInt16,
                          instanceName: `${DeviceClass.deviceType} at ${hex(4, '0x', nextFreeAddress)}`,
                        },
                      ]);
                      break;
                    case 'BusDeviceDummy':
                      params = busDeviceParams<'BusDeviceDummy'>(id, selectedDeviceForNew, [
                        {
                          instanceId: id,
                          startAddress: nextFreeAddress as UInt16,
                          instanceName: `${DeviceClass.deviceType} at ${hex(4, '0x', nextFreeAddress)}`,
                        },
                        new Date(),
                      ]);
                      break;
                    default:
                      assertNever(selectedDeviceForNew);
                  }

                  setComputerConfiguration({
                    ...computerConfiguration,
                    busConfiguration: {
                      ...computerConfiguration.busConfiguration,
                      devices: [...computerConfiguration.busConfiguration.devices, params],
                    },
                  });
                  setSelectedDeviceForNew(null);
                }}
                disabled={!selectedDeviceForNew}
              >
                Add
              </Button>
            </p>
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              onClick={() => {
                setComputerConfiguration(defaultComputerConfiguration);
              }}
            >
              Reset
            </Button>
            <div>
              <Button
                onClick={() => {
                  setComputerConfiguration(initialConfiguration);
                  preferencesDialogRef.current?.close();
                }}
              >
                Cancel
              </Button>

              <Button
                disabled={hasErrors}
                className="ml-3"
                onClick={async () => {
                  if (hasErrors) {
                    return;
                  }
                  onConfigurationChange(computerConfiguration);
                  preferencesDialogRef.current?.close();
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </Pane>
      </dialog>
    </>
  );
}
