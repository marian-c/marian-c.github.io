import React, { type ComponentProps } from 'react';
import { UploadButton } from '@/components/upload-button/upload-button';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';
import { Pane } from '@/components/pane/pane';
import { HexInput } from '@/components/HexInput/HexInput';
import { HexNumber } from '@/components/HexNumber/HexNumber';
import { FancyRange } from '@/components/FancyRange/FancyRange';
import { Box } from '@/components/_templates/box/box';
import { assertIsDefined, assertNever } from '@/utils';
import { tableCN } from '@/app/classnames';
import type { RomInformation } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import { Samples } from '@/app/simple-6502-assembler-emulator/emulator6502/dialogs/Samples';

type Props = {
  currentRom: RomInformation;
  $setCurrentRom: (newRomInformation: RomInformation) => void;
};

// TODO: samples should come with their own computer configuration

export const RomSection: React.FunctionComponent<Props> = function ({
  currentRom,
  $setCurrentRom,
}) {
  const [uploadedFileDetails, setUploadedFileDetails] = React.useState<{
    uint8Array: Uint8Array;
    name: string;
    size: number;
  }>();

  const [hasCustomInitialPc, setHasCustomInitialPc] = React.useState(false);
  const [startingPosition, _setStartingPosition] = React.useState(0);
  const [initialPc, setInitialPc] = React.useState(0);

  const [startingPositionError, setStartingPositionError] = React.useState(false);
  const [initialPcError, setInitialPcError] = React.useState(false);

  const uploadedFileSize = uploadedFileDetails?.size ?? 0;

  const $setStartingPosition = React.useCallback(
    function setStartingPosition(newStartingPosition: number) {
      _setStartingPosition(newStartingPosition);
      if (initialPc < newStartingPosition) {
        setInitialPcError(false);
        setInitialPc(newStartingPosition);
      }
      if (initialPc > newStartingPosition + uploadedFileSize - 1) {
        setInitialPcError(false);
        setInitialPc(newStartingPosition + uploadedFileSize - 1);
      }
    },
    [initialPc, uploadedFileSize],
  );

  const dialogRef = React.useRef<HTMLDialogElement>(null);

  let romKindElement: React.ReactNode = 'None';
  const currentRomType = currentRom.type;
  switch (currentRomType) {
    case 'sample':
      romKindElement = 'sample';
      break;
    case 'user_supplied':
      romKindElement = 'user supplied';
      break;
    case 'compiled':
      romKindElement = 'compiled from source';
      break;
    case 'empty':
      romKindElement = 'empty';
      break;
    default:
      assertNever(currentRomType);
  }

  const $onFileReady = React.useCallback<ComponentProps<typeof UploadButton>['$onFileReady']>(
    (buffer, name, size) => {
      // TODO: showModal runs faster than react can process the state change and flashes the old/default content
      setUploadedFileDetails({
        uint8Array: new Uint8Array(buffer),
        name,
        size,
      });
      $setStartingPosition(0);
      setInitialPc(0);
      setHasCustomInitialPc(false);
      dialogRef.current?.showModal();
    },
    [$setStartingPosition],
  );

  const [isSamplesOpen, setIsSamplesOpen] = React.useState(false);

  const $onNewSample = React.useCallback<ComponentProps<typeof Samples>['$onDone']>(
    async (sample) => {
      setIsSamplesOpen(false);
      if (sample !== null) {
        // TODO: error handling
        const fetchR = await fetch(sample);
        const data = new Uint8Array(await fetchR.arrayBuffer());

        $setCurrentRom({
          type: 'sample',
          description: sample,
          size: data.byteLength,
          initialPc: 0x0400,
          startingAddress: 0x000a,
          contents: data,
        });
      }
    },
    [$setCurrentRom],
  );
  return (
    <div>
      <table className={tableCN}>
        <tbody>
          <tr>
            <td className="">Kind</td>
            <td className="">{romKindElement}</td>
          </tr>
          <tr>
            <td className="">Initial size</td>
            <td className="">
              <HexNumber value={currentRom.size} use="dec" />
            </td>
          </tr>
          <tr>
            <td className="">Starting address</td>
            <td className="">
              <HexNumber value={currentRom.startingAddress} use="hex" />
            </td>
          </tr>
          <tr>
            <td className="">Custom Initial PC?</td>
            <td className="">{currentRom.initialPc !== null ? 'yes' : 'no'}</td>
          </tr>
          <tr>
            <td className="">Initial PC</td>
            <td className="">
              {currentRom.initialPc !== null ? (
                <HexNumber value={currentRom.initialPc} use="hex" />
              ) : (
                'TODO: get PC from the driver'
              )}
            </td>
          </tr>
          <tr>
            <td className="">Description</td>
            <td className="">{currentRom.description}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4">
        <UploadButton $onFileReady={$onFileReady}>Upload</UploadButton>{' '}
        <Button
          onClick={() => {
            setIsSamplesOpen(true);
          }}
        >
          Sample
        </Button>{' '}
        <Button
          onClick={() => {
            alert('TODO: download button');
          }}
        >
          Download
        </Button>
      </p>
      {isSamplesOpen && <Samples $onDone={$onNewSample} />}
      {
        <dialog ref={dialogRef}>
          <Pane
            header="Configure ROM file upload"
            contentClassName="p-2 max-w-[600px]"
            headerButtons={[
              <Button
                className="ml-5"
                key="close-button"
                onClick={() => {
                  dialogRef.current?.close();
                }}
              >
                <Icon src="/static_assets/svg/close.svg" />{' '}
              </Button>,
            ]}
          >
            <div>
              <p>
                Your uploaded file:{' '}
                <span className="font-semibold">{uploadedFileDetails?.name}</span> with size:{' '}
                <HexNumber
                  value={uploadedFileSize}
                  use="dec"
                  render={({ decValue }) => {
                    return <span className="font-semibold">{decValue} bytes</span>;
                  }}
                />{' '}
                needs to be configured before loading.
              </p>
              {uploadedFileSize === 0 ? (
                <p className="text-red-500">This file is empty</p>
              ) : uploadedFileSize > 0xffff + 1 ? (
                <p className="text-red-500">
                  This file is too big, needs to be smaller than{' '}
                  <HexNumber
                    value={0xffff + 1}
                    use="dec"
                    render={({ decValue }) => {
                      return <>{decValue} bytes</>;
                    }}
                  />
                </p>
              ) : (
                <>
                  <Box header="Location" className="mt-4">
                    <p className="mt-4">
                      0 &le;{' '}
                      <HexInput
                        size={4}
                        onError={() => {
                          setStartingPositionError(true);
                        }}
                        value={startingPosition}
                        min={0}
                        max={0xffff - uploadedFileSize + 1}
                        onChange={(v) => {
                          setStartingPositionError(false);
                          $setStartingPosition(v);
                        }}
                      />{' '}
                      &ndash;{' '}
                      <HexInput
                        size={4}
                        onError={() => {
                          setStartingPositionError(true);
                        }}
                        min={uploadedFileSize - 1}
                        max={0xffff}
                        value={startingPosition + uploadedFileSize - 1}
                        onChange={(v) => {
                          setStartingPositionError(false);
                          $setStartingPosition(v - uploadedFileSize + 1);
                        }}
                      />{' '}
                      &le; <HexNumber value={0xffff} use="hex" />
                      <FancyRange
                        className="mt-4"
                        value={startingPosition}
                        range={0xffff}
                        size={uploadedFileSize}
                        onChange={(v) => {
                          $setStartingPosition(v);
                        }}
                      />
                    </p>
                  </Box>
                  <Box
                    header={
                      <>
                        <input
                          type="checkbox"
                          checked={hasCustomInitialPc}
                          onChange={() => {
                            setHasCustomInitialPc(!hasCustomInitialPc);
                          }}
                        />{' '}
                        Set Initial PC
                      </>
                    }
                    className="mt-4"
                  >
                    {hasCustomInitialPc ? (
                      <>
                        <span className="font-mono">
                          <HexNumber value={startingPosition} use="hex" />
                        </span>
                        {'  '}&le;{' '}
                        <HexInput
                          size={4}
                          onError={() => {
                            setInitialPcError(true);
                          }}
                          min={startingPosition}
                          max={startingPosition + uploadedFileSize - 1}
                          value={initialPc}
                          onChange={(v) => {
                            setInitialPcError(false);
                            setInitialPc(v);
                          }}
                        />{' '}
                        &le;{' '}
                        <span className="font-mono">
                          <HexNumber value={startingPosition + uploadedFileSize - 1} use="hex" />
                        </span>
                      </>
                    ) : (
                      <p>The initial PC will be loaded from the normal reset vector</p>
                    )}
                  </Box>
                </>
              )}
              <p className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    dialogRef.current?.close();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="ml-3"
                  disabled={
                    startingPositionError ||
                    initialPcError ||
                    uploadedFileSize === 0 ||
                    uploadedFileSize > 0xffff + 1
                  }
                  onClick={() => {
                    assertIsDefined(uploadedFileDetails);
                    $setCurrentRom({
                      type: 'user_supplied',
                      description: uploadedFileDetails.name || '[name not found]',
                      size: uploadedFileSize,
                      initialPc: hasCustomInitialPc ? initialPc : null,
                      contents: uploadedFileDetails.uint8Array,
                      startingAddress: startingPosition,
                    });
                    dialogRef.current?.close();
                  }}
                >
                  OK
                </Button>
              </p>
            </div>
          </Pane>
        </dialog>
      }
    </div>
  );
};
