import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5, imm: 6, ind: 7 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('ind addressing mode', () => {
  test('simple ', () => {
    expect(handle('LDA ($a1a1) ;')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LdA ($0101);')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LdA (SR)');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LdA (12)');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LdA (%0101)');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LdA ("a")');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LdA ("abc")');
    expect(result).toMatchSnapshot();
  });
});

describe('IND mode errors', () => {
  test('errors', () => {
    expect(
      handle(`
LDA ($a1a1 )
LDA ( $a1a1 )
LDA ($a1a1),
LDA ($a1a1,)
          
LDA (#$a1a1)
    `),
    ).toMatchSnapshot();
  });
});
