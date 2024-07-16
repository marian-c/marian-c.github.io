import React from 'react';
import type { FunctionComponent } from '@/types';
import { Slot } from '@/components/_helpers/Slot';

type HexInputProps = {
  min: number;
  max: number;
  children: React.ReactElement<{ hasError: boolean }>;
};

const HexInput: FunctionComponent<HexInputProps> = function (props) {
  return <Slot {...props} />;
};

const Input: FunctionComponent<{ asd: string }> = function () {
  return <input />;
};

export default function PageSlot() {
  return (
    <div>
      Slot
      <HexInput min={2} max={10}>
        <Input asd="asd" />
      </HexInput>
    </div>
  );
}
