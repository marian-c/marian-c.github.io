import React from 'react';
import type { FunctionComponent } from '@/types';
import { Dialog } from '@/components/_atoms/Dialog';
import { Pane } from '@/components/pane/pane';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';
import { textLinkCN } from '@/app/classnames';
import { sampleKlaus, sampleEhBasic } from '@/staticFiles';
import type { RomInformation } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';

type SampleIdentifier = string;

type SampleConfig = {
  sampleLocation: SampleIdentifier;
  label: string;
  description: React.ReactNode;
  romInformation: RomInformation;
};

const sampleKlausLabel = 'Emulator test from Klaus - no decimal mode';
const sampleEhBasicLabel = 'EhBASIC - ROM image with EhBasic';

const samplesConfig: SampleConfig[] = [
  {
    sampleLocation: sampleKlaus,
    label: sampleKlausLabel,
    description: (
      <p>
        This was generated from these sources, compiled without dec mode tests, TODO: fill in the
        rest of the details, like github link and so on
      </p>
    ),
    romInformation: {
      type: 'sample',
      contents: new Uint8Array(),
      size: 65_526,
      initialPc: 0x0400,
      startingAddress: 0x000a,
      description: sampleKlausLabel,
    },
  },
];

if (process.env.NEXT_PUBLIC_FEATURE_EHBASIC === 'true') {
  samplesConfig.push({
    sampleLocation: sampleEhBasic,
    label: sampleEhBasicLabel,
    description: <p>TODO: fill this in</p>,
    romInformation: {
      type: 'sample',
      contents: new Uint8Array(),
      size: 16_384,
      startingAddress: 0xc000,
      initialPc: null,
      description: sampleKlausLabel,
    },
  });
}

export const Samples: FunctionComponent<{
  $onDone: (sampleConfig: SampleConfig | null) => void;
}> = function ({ $onDone }) {
  const $onDialogCancel = React.useCallback(() => {
    $onDone(null);
  }, [$onDone]);

  const [selectedSampleLocation, setSelectedSampleLocation] =
    React.useState<SampleIdentifier | null>(null);

  return (
    <Dialog $onCancel={$onDialogCancel}>
      <Pane
        header="Pick a sample"
        className="w-[500px] overflow-auto"
        contentClassName="p-2 pt-6"
        headerButtons={[
          <Button
            className="ml-5"
            onClick={() => {
              $onDialogCancel();
            }}
            key="close-button"
          >
            <Icon src="/static_assets/svg/close.svg" />{' '}
          </Button>,
        ]}
      >
        <div className="">
          {samplesConfig.map((sampleConfig) => {
            return (
              <React.Fragment key={sampleConfig.sampleLocation}>
                <h4>
                  <label>
                    <input
                      type="radio"
                      name="sample-rom-option"
                      className="mr-2"
                      checked={selectedSampleLocation === sampleConfig.sampleLocation}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSampleLocation(sampleConfig.sampleLocation);
                        }
                      }}
                    />
                    {sampleConfig.label}
                  </label>
                </h4>
                {selectedSampleLocation === sampleConfig.sampleLocation && (
                  <div className="p-2">
                    {sampleConfig.description}
                    <p>
                      <a className={textLinkCN} href={sampleConfig.sampleLocation}>
                        Download
                      </a>
                    </p>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <p className="mt-6 flex justify-end">
          <Button
            onClick={() => {
              $onDialogCancel();
            }}
          >
            Cancel
          </Button>

          <Button
            disabled={selectedSampleLocation === null}
            className="ml-3"
            onClick={async () => {
              const selectedSample = samplesConfig.find(
                (s) => s.sampleLocation === selectedSampleLocation,
              );
              if (selectedSample === undefined) {
                throw new ErrorShouldNotHappen();
              }
              $onDone(selectedSample);
            }}
          >
            OK
          </Button>
        </p>
      </Pane>
    </Dialog>
  );
};
