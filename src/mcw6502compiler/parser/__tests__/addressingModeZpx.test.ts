import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { zp0: 4, zpx: 5, zpy: 6 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('zpx', () => {
  test('simple ', () => {
    expect(handle('LDA $a1,X')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LDA $a1,x;')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LDA.b lbl,x');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA.b 12345,x');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA.b %0101,x');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA.b "a",x');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA.b "abc",x');
    expect(result).toMatchSnapshot();
  });
});

describe('zero page x mode error', () => {
  test('error when operand is incomplete', () => {
    expect(handle(`LDA $a1,`)).toMatchSnapshot();
  });
  test('error when operator is incomplete', () => {
    expect(handle(`LD $a1,X`)).toMatchSnapshot();
  });
});
