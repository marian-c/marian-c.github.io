import React from 'react';

type Props = { horizontal?: boolean | undefined; vertical?: boolean | undefined };

export const Overflow: React.FunctionComponent<React.PropsWithChildren<Props>> = function ({
  children,
  horizontal,
  vertical,
}) {
  return (
    <div className={`flex overflow-auto flex-grow ${(vertical && 'h-0') || ''}`}>
      <div className={`overflow-auto flex-grow ${(horizontal && 'w-0') || ''}`}>{children}</div>
    </div>
  );
};
