import type { FunctionComponentWithChildren } from '@/types';
import React from 'react';

export const Dialog: FunctionComponentWithChildren<{ $onCancel: () => void }> = function ({
  children,
  $onCancel,
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    dialogRef.current?.showModal();
  }, []);
  React.useEffect(() => {
    const dialog = dialogRef.current;
    const onClose = () => {
      $onCancel();
    };

    dialog?.addEventListener('close', onClose);
    return () => {
      dialog?.removeEventListener('close', onClose);
    };
  }, [$onCancel]);
  return <dialog ref={dialogRef}>{children}</dialog>;
};
