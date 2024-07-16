import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = {
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5, imm: 6, ind: 7, izx: 8, izy: 9 },
  BNE: { rel: 10 },
};

function handle(s: string) {
  return parseSource(s, { instructionsInfo: phase2(instructionsInfo) });
}

describe('REL addressing mode with reference to label', () => {
  test('simple ', () => {
    expect(handle('BNE existingLabel ;')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('BNE existingLabel; ')).toMatchSnapshot();
  });
});

describe('REL addressing mode with address', () => {
  test('simple', () => {
    expect(handle('BNE lbl\nBNE $AB1D')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('BNE lbl');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('BNE 12345');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('BNE %0101');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('BNE "a"');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('BNE "abc"');
    expect(result).toMatchSnapshot();
  });
});

describe('REL mode errors', () => {
  test('errors', () => {
    expect(
      handle(`
BNE existingLabel,
BNE (existingLabel) ;
    `),
    ).toMatchSnapshot();
  });
});
