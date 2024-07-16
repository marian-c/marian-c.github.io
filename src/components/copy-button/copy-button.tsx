import React from 'react';
import useTimeoutFn from '@/hooks/useTimeoutFn';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/icon/icon';

export const CopyButton: React.FunctionComponent<
  React.PropsWithChildren<{
    title?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    value: string;
  }>
> = function ({ title, onClick, children, value }) {
  const [state, setState] = React.useState(false);
  const revert = useTimeoutFn(function () {
    setState(false);
  }, 2500);

  return (
    <Button
      title={title}
      onClick={async (e) => {
        await navigator.clipboard.writeText(value);
        setState(true);
        revert();
        if (onClick) {
          onClick(e);
        }
      }}
      inaccessibleChildren={!state ? <Icon src="/svg/copy.svg" /> : <Icon src="/svg/check.svg" />}
    >
      {children}
    </Button>
  );
};
