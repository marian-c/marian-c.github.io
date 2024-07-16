import React from 'react';
import css from './FanciRange.module.css';

type Props = {
  value: number;
  range: number;
  size: number;
  onChange: (newValue: number) => void;
  className?: string | undefined;
};
export const FancyRange: React.FunctionComponent<React.PropsWithChildren<Props>> = function ({
  className,
  value,
  range,
  size,
  onChange,
}) {
  const max = range - size + 1;
  const width = Math.max((size / range) * 100, 3);
  return (
    <input
      style={{ '--range-thumb-size': `${width}%` }}
      type="range"
      min={0}
      max={max}
      step={1}
      className={`w-full ${css['Input']} ${className}`}
      value={value}
      onChange={(e) => {
        onChange(parseInt(e.target.value, 10));
      }}
    />
  );
};
