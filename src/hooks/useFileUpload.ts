import React from 'react';

import { noopThrow } from '@/utils';

export function useFileUpload($onSelect: (file: File) => void) {
  const inputRef = React.useRef<HTMLInputElement>();
  const onChangeRef = React.useRef<(target: HTMLInputElement) => void>(noopThrow);

  React.useEffect(() => {
    onChangeRef.current = (target) => {
      const file = target.files?.item(0);
      if (!file) {
        // this can happen when canceling as well
        // TODO: better error handling, though unlikely
        return;
      }
      $onSelect(file);
      // allow selecting the same file again
      target.value = '';
    };
  }, [$onSelect]);

  React.useEffect(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('style', 'display: none');
    input.setAttribute('multiple', 'false');

    input.addEventListener('change', async ({ target }) => {
      if (!(target instanceof HTMLInputElement)) {
        throw new Error('target in change event is not instance of HTMLInputElement');
      }
      onChangeRef.current(target);
    });

    document.body.append(input);
    inputRef.current = input;
    return () => {
      document.body.removeChild(inputRef.current!);
    };
  }, []);

  const triggerFilePicker = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    triggerFilePicker,
  };
}
