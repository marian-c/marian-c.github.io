import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

const instructionsInfo = phase2({
  BRK: { IMP: 1 }, // implied
  IMM: { IMM: 2 }, // fake test instruction
  ZPZ: { ZP0: 3 }, // fake test instruction
  ABS: { ABS: 4 }, // fake test instruction
  ZPX: { ZPX: 5 }, // fake test instruction
  ZPY: { ZPY: 6 }, // fake test instruction
  ABX: { ABX: 7 }, // fake test instruction
  ABY: { ABY: 8 }, // fake test instruction
  IND: { IND: 9 }, // fake test instruction
  IZX: { IZX: 10 }, // fake test instruction
  IZY: { IZY: 11 }, // fake test instruction
  BNE: { REL: 12 },
  LDX: {
    IMM: 13,
    ABS: 14,
    ZP0: 15,
  },

  LDA: {
    IMM: 17,
    ABS: 18,
    ZPX: 19,
    ZPY: 20,
    ABX: 21,
    ABY: 22,
  },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('simple, empty lines', () => {
  test('empty line', () => {
    expect(handle('')).toMatchSnapshot();
    expect(handle('\n')).toMatchSnapshot();
  });
});

describe('simple comments', () => {
  it('simple comment', () => {
    expect(handle(';this is a comment')).toMatchSnapshot();
  });
  it('comments and empty lines', () => {
    expect(handle('\n;t')).toMatchSnapshot();
    expect(handle('\n;t\n;t')).toMatchSnapshot();
    expect(handle('\n;\n;')).toMatchSnapshot();
  });
});

describe('instructions', () => {
  it('with empty lines', () => {
    expect(handle('\nbrk')).toMatchSnapshot();
  });
  it('with empty lines and comments', () => {
    expect(handle('\nbrk ;comment')).toMatchSnapshot();
  });
});
