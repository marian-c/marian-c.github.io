import React from 'react';

type Props = {
  horizontal?: boolean | undefined;
  grow?: boolean | undefined;
  className?: string | undefined;
  containerRef?: React.RefObject<HTMLDivElement>;
};

export const View: React.FunctionComponent<React.PropsWithChildren<Props>> = function ({
  children,
  horizontal,
  grow,
  className = '',
  containerRef,
}) {
  const cn = horizontal ? 'flex-row' : 'flex-col';
  const cn2 = grow ? 'flex-grow' : '';
  return (
    <div ref={containerRef} className={`flex ${cn} ${cn2} ${className}`}>
      {children}
    </div>
  );
};
