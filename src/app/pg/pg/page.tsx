'use client';
import { LayoutSpread } from '@/components/_layouts/LayoutSpread';
import React, { useState } from 'react';
import { addToast, type Toast } from '@/components/_helpers/toast';
import { Button } from '@/components/Button/Button';
import type { FunctionComponent } from '@/types';
import { Dialog } from '@/components/_atoms/Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/_helpers/tooltip';

const ComponentInOverlay: FunctionComponent<{
  initialData: string;
  $onDone: (result: string | null) => void;
}> = function ({ initialData, $onDone }) {
  const [v, setV] = useState('');
  const $onCancel = React.useCallback(() => {
    $onDone(null);
  }, [$onDone]);
  return (
    <Dialog $onCancel={$onCancel}>
      InitialData: {initialData}
      <br />
      <input
        value={v}
        onChange={(e) => {
          setV(e.target.value);
        }}
      />
      <button
        onClick={() => {
          $onDone(v);
        }}
      >
        Done
      </button>
    </Dialog>
  );
};

export default function PagePg() {
  const toast: Toast = {
    showClose: true,
    contents: 'toast contents',
  };
  const [isOpen, setIsOpen] = React.useState(false);
  const [data, setData] = React.useState('');
  const [result, setResult] = React.useState('');
  const $onDone = React.useCallback<React.ComponentProps<typeof ComponentInOverlay>['$onDone']>(
    (result) => {
      if (result !== null) {
        setResult(result);
      }
      setIsOpen(false);
    },
    [],
  );

  return (
    <>
      <LayoutSpread useChild dontWrapLeft>
        <div className="text-red-400">
          <Button
            onClick={() => {
              addToast(toast);
            }}
          >
            Left - show toast
          </Button>
          Right
        </div>
      </LayoutSpread>
      <Button
        onClick={() => {
          setData('dataSet' + Math.random());
          setIsOpen(true);
        }}
      >
        Open modal
      </Button>
      Result: {result}
      {isOpen && <ComponentInOverlay $onDone={$onDone} initialData={data} />}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>.....</Button>
        </TooltipTrigger>
        <TooltipContent>Hello tooltip</TooltipContent>
      </Tooltip>
    </>
  );
}
