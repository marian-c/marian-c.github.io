import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('Instruction without operand', () => {
  test('simple - accumulator', () => {
    expect(handle('ROR')).toMatchSnapshot();
  });
  test('simple - implied', () => {
    expect(handle('INX')).toMatchSnapshot();
  });
});

describe('instruction without operand error', () => {
  test('when not recognised', () => {
    expect(handle('INL')).toMatchSnapshot();
  });
  test('when too big', () => {
    expect(handle('INXL')).toMatchSnapshot();
  });
});
