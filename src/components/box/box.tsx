import React from 'react';
import { mergeClassNameFirstPriority } from '@/helpers/properties';

export const Box: React.FunctionComponent<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    className?: string | undefined;
  }>
> = function ({ header, children, className }) {
  let headerEl = null;
  const cn =
    'absolute left-2 top-0 translate-y-[-50%] bg-pane-background border-l border-r border-l-neutral-500 border-r-neutral-500 leading-none pl-2 pr-2';
  if (header) {
    if (typeof header === 'object' && 'type' in header) {
      headerEl = React.cloneElement(header, mergeClassNameFirstPriority(header.props, cn));
    } else {
      headerEl = <div className={cn}>{header}</div>;
    }
  }

  return (
    <div className={`border border-neutral-500 relative mt-2 p-2 pt-4 ${className ?? ''}`}>
      {headerEl}
      <div>{children}</div>
    </div>
  );
};
