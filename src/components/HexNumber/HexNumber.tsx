import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/_helpers/tooltip';

// TODO: support padding of zeros
type Props = {
  value: number;
  use: 'hex' | 'dec';
  render?: (value: { decValue: string; hexValue: string }) => React.ReactNode;
};

export const HexNumber: React.FunctionComponent<React.PropsWithChildren<Props>> = ({
  value,
  use,
  render,
}) => {
  const hexValue = value.toString(16).toUpperCase();
  const decValue = value.toString(10);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span title="asdasd" className="border-b border-black border-dotted whitespace-pre">
          {render ? render({ decValue, hexValue }) : use === 'hex' ? `0x${hexValue}` : decValue}
        </span>
      </TooltipTrigger>
      <TooltipContent>{use === 'hex' ? `dec: ${decValue}` : `0x${hexValue}`} </TooltipContent>
    </Tooltip>
  );
};
