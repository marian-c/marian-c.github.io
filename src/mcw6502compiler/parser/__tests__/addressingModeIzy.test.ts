import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5, imm: 6, ind: 7, izx: 8, izy: 9 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('IZY addressing mode', () => {
  test('simple ', () => {
    expect(handle('LDA ($a1),y ;')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LdA ($01),Y;')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LdA (SR),Y');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LdA (12),Y');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LdA (%0101),Y');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LdA ("a"),Y');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LdA ("abc"),Y');
    expect(result).toMatchSnapshot();
  });
});

describe('IZY mode errors', () => {
  test('errors', () => {
    expect(
      handle(`
LDA ($a1 ),y
LDA ($a1), y
LDA ($a1) ,y
LDA ($a1),y,
LDA ($a1),h
            
          
LDA (#$a1),y
    `),
    ).toMatchSnapshot();
  });
});
