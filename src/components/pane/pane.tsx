import React from 'react';
import { View } from '@/components/view/view';

type Props = {
  header?: React.ReactNode;
  headerButtons?: React.ReactNode[];
  full?: boolean;
  className?: string | undefined;
  headerClassName?: string | undefined;
  contentClassName?: string | undefined;
};
export const Pane: React.FunctionComponent<React.PropsWithChildren<Props>> = function ({
  className,
  children,
  header,
  headerButtons,
  full,
  headerClassName,
  contentClassName,
}) {
  const hasHeader = header !== undefined || headerButtons !== undefined;

  const headerEl = !hasHeader ? null : (
    <div
      className={`flex items-center justify-between bg-white pl-2 pr-2 pt-1 pb-1 ${headerClassName}`}
    >
      <div>{header}</div>
      <div>{headerButtons}</div>
    </div>
  );
  const wrapperExtraCN = full ? '' : 'inline-block';
  return (
    <View
      className={`${wrapperExtraCN} bg-pane-background border border-neutral-500  ${className ?? ''}`}
    >
      {headerEl}
      <View grow className={`${contentClassName}`}>
        {children}
      </View>
    </View>
  );
};
