import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/_helpers/tooltip';
import { hex } from '@/helpers/numbers';

// TODO: support padding of zeros
type Props = {
  value: number;
  use: 'hex' | 'dec';
  paddingLengthForHex?: number;
  render?: (value: { decValue: string; hexValue: string }) => React.ReactNode;
};

export const HexNumber: React.FunctionComponent<React.PropsWithChildren<Props>> = ({
  value,
  use,
  render,
  paddingLengthForHex = 4,
}) => {
  const hexValue = hex(paddingLengthForHex, '0x', value);
  const decValue = value.toString(10);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-black border-dotted whitespace-pre">
          {render ? render({ decValue, hexValue }) : use === 'hex' ? hexValue : decValue}
        </span>
      </TooltipTrigger>
      <TooltipContent>{use === 'hex' ? `dec: ${decValue}` : hexValue} </TooltipContent>
    </Tooltip>
  );
};
