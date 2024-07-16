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

describe('zpy', () => {
  test('simple ', () => {
    expect(handle('LDA $a1,y')).toMatchSnapshot();
  });
  test('simple 2', () => {
    expect(handle('LdA $a1,Y')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LDA.b lbl,y');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA.b 12345,y');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA.b %0101,y');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA.b "a",y');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA.b "abc",y');
    expect(result).toMatchSnapshot();
  });
});

describe('Absolute mode error', () => {
  test('error when operator is incomplete', () => {
    expect(handle(`LD $a1,y`)).toMatchSnapshot();
  });
});
