import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('ABY', () => {
  test('simple ', () => {
    expect(handle('LDA $a1a1,y')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LdA $a1a1,y')).toMatchSnapshot();
  });
  test('with symbol', () => {
    const result = handle('LDA SR,y');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA 12,y');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA %0101,y');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA "a",y');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA "abc",y');
    expect(result).toMatchSnapshot();
  });
});

describe('ABY mode error', () => {
  test('error when operator is incomplete', () => {
    expect(handle(`LD $a1a1,y`)).toMatchSnapshot();
  });
});
