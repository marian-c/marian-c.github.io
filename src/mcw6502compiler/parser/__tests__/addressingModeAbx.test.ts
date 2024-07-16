import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { abs: 4, abx: 5 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('ABX', () => {
  test('simple ', () => {
    expect(handle('LDA $a1a1,X')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LdA $a1a1,x')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LDA SR,x');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA 12,x');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA %0101,x');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA "a",x');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA "abc",x');
    expect(result).toMatchSnapshot();
  });
});

describe('ABX mode error', () => {
  test('error when operand is incomplete', () => {
    expect(handle(`LDA $a1a1,`)).toMatchSnapshot();
  });
  test('error when operand is incomplete, various values', () => {
    const result = handle(`
LDA RR,
LDA 12,
LDA %1101,
LDA "a",
LDA "ABc",
    `);
    expect(result).toMatchSnapshot();
  });
  test('error when operator is incomplete', () => {
    expect(handle(`LD $a1a1,X`)).toMatchSnapshot();
  });
});
