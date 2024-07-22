import { Olc6502 } from './olc6502';

export interface AddressingMode {
  (cpu: Olc6502): 0 | 1;
  fName: string;
}

export type Operator = (cpu: Olc6502) => 0 | 1;

export type Instruction = [
  name: string,
  operator: Operator,
  addressingMode: AddressingMode,
  cycles: number,
];
