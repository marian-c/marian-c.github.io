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

describe('label definition', () => {
  test('simple', () => {
    expect(handle('ml:')).toMatchSnapshot();
  });

  test('Label and comment on the same line', () => {
    expect(handle('ml: ;comment')).toMatchSnapshot();
  });
  test('multiple labels', () => {
    expect(handle(`ml:\nml2:`)).toMatchSnapshot();
  });
  test('multiple labels same name', () => {
    // this is allowed, but the validation will fail
    expect(handle(`ml2:\nml2:`)).toMatchSnapshot();
  });
});

describe('label definition error', () => {
  test('no error when space after', () => {
    expect(handle('ml:   ')).toMatchSnapshot();
  });
  test('error when anything after', () => {
    expect(handle('ml0: \nml: zzz \nml1:')).toMatchSnapshot();
  });
  test('error when multiple labels', () => {
    expect(handle('ml:ml2:')).toMatchSnapshot();
  });
  test('error when multiple colons', () => {
    expect(handle('ml::')).toMatchSnapshot();
  });

  test('error when space before colon', () => {
    expect(handle('ml :')).toMatchSnapshot();
  });
  test('multiple errors on the same line', () => {
    expect(handle('ml :ml2 : ml3')).toMatchSnapshot();
  });
});
