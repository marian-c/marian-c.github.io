import React from 'react';

import { noop } from '@/utils';
import { textInputCN } from '@/app/classnames';
import usePrevious from '@/hooks/usePrevious/usePrevious';

type Props = {
  size: number;
  min?: number | undefined;
  max?: number | undefined;
  value: number;
  onChange: (newValue: number) => void;
  onError?: (() => void) | undefined;
  noHint?: boolean | undefined;
  className?: string | undefined;
};

export const HexInput: React.FunctionComponent<Props> = function ({
  size,
  value,
  onChange,
  min = 0,
  max = Infinity,
  onError = noop,
  noHint,
  className,
}) {
  const [isError, setIsError] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value.toString(16).toUpperCase());
  // TODO: dep array in the useEffect make this usePrevious not needed
  const previousValue = usePrevious(value);
  React.useEffect(() => {
    // TODO: achieve the same without using an effect to avoid re-render
    if (previousValue !== undefined && previousValue !== value) {
      setLocalValue(value.toString(16).toUpperCase());
      setIsError(false);
    }
  }, [previousValue, value]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <span className={`relative inline-block ${className ?? ''}`}>
        <input
          ref={inputRef}
          onKeyDown={(e) => {
            if (
              (e.code === 'ArrowDown' || e.code === 'ArrowUp') &&
              !e.metaKey &&
              !e.shiftKey &&
              !e.altKey &&
              !e.ctrlKey
            ) {
              e.preventDefault();
              if (!isError) {
                const newNum = e.code === 'ArrowDown' ? value - 1 : value + 1;
                if (newNum >= min && newNum <= max) {
                  onChange(newNum);
                }
              }
            }
          }}
          type="text"
          className={`${textInputCN} font-mono ${isError ? 'flag-error' : ''}`}
          value={isError ? localValue : value.toString(16).toUpperCase()}
          maxLength={size}
          size={size + (noHint ? 0 : 2)}
          onChange={(e) => {
            const inputValue = e.target.value;
            let numberValue = parseInt(inputValue, 16);
            setLocalValue(inputValue);
            if (!isNaN(numberValue) && numberValue >= min && numberValue <= max) {
              onChange(numberValue);
              setIsError(false);
            } else {
              onError();
              setIsError(true);
            }
          }}
        />
        {!noHint && (
          <span
            onClick={() => {
              inputRef.current?.focus();
            }}
            style={{ lineHeight: 'normal' }}
            className="block text-gray-500 font-mono absolute left-0 top-[50%] translate-y-[-50%] h-[100%] p-1 border border-transparent "
          >
            0x
          </span>
        )}
      </span>
    </>
  );
};
