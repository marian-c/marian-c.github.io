import React from 'react';
import type { FunctionComponent } from '@/types';
import { Dialog } from '@/components/_atoms/Dialog';
import { Pane } from '@/components/pane/pane';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';
import { textLinkCN } from '@/app/classnames';
import { sampleKlaus } from '@/staticFiles';

type Sample = string;

export const Samples: FunctionComponent<{
  $onDone: (sample: Sample | null) => void;
}> = function ({ $onDone }) {
  const $onDialogCancel = React.useCallback(() => {
    $onDone(null);
  }, [$onDone]);

  const [selectedSample, setSelectedSample] = React.useState<Sample | null>(null);

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
          <h4>
            <label>
              <input
                type="radio"
                name="sample-rom-option"
                className="mr-2"
                checked={selectedSample === sampleKlaus}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSample(sampleKlaus);
                  }
                }}
              />
              Emulator test from Klaus - no decimal mode
            </label>
          </h4>
          {selectedSample === sampleKlaus && (
            <div className="p-2">
              <p>
                This was generated from these sources, compiled without dec mode tests, TODO: fill
                in the rest of the details, like github link and so on
              </p>
              <p>
                <a className={textLinkCN} href={sampleKlaus}>
                  Download
                </a>
              </p>
            </div>
          )}
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
            disabled={selectedSample === null}
            className="ml-3"
            onClick={async () => {
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
