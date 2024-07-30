import React from 'react';
import { Button } from '@/components/Button/Button';
import { useFileUpload } from '@/hooks/useFileUpload';

type Props = {
  $onFileReady: (buffer: ArrayBuffer, name: string, size: number) => void;
};
export const UploadButton: React.FunctionComponent<React.PropsWithChildren<Props>> = function ({
  children,
  $onFileReady,
}) {
  const [processing, setProcessing] = React.useState(false);
  const $onSelect = React.useCallback(
    async (file: File) => {
      setProcessing(true);
      // TODO: catch and handle error
      try {
        $onFileReady(await file.arrayBuffer(), file.name, file.size);
      } finally {
        setProcessing(false);
      }
    },
    [$onFileReady],
  );
  const { triggerFilePicker } = useFileUpload($onSelect);

  return (
    <Button disabled={processing} onClick={triggerFilePicker}>
      {children}
    </Button>
  );
};
