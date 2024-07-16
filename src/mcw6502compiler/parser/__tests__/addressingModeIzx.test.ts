import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5, imm: 6, ind: 7, izx: 8 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('IZX addressing mode', () => {
  test('simple ', () => {
    expect(handle('LDA ($a1,X) ;')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LdA ($01,X);')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LdA (SR,X)');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LdA (12,X)');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LdA (%0101,X)');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LdA ("a",X)');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LdA ("abc",X)');
    expect(result).toMatchSnapshot();
  });
});

describe('IZX mode errors', () => {
  test('errors', () => {
    expect(
      handle(`
LDA ($a1,x )
LDA ($a1, x)
LDA ($a1 ,x)
LDA ($a1,x),
LDA ($a1,v)
            
          
LDA (#$a1,x)
    `),
    ).toMatchSnapshot();
  });
});
