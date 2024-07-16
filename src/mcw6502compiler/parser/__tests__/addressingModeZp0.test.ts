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

describe('Zero page mode', () => {
  test('simple - len 4', () => {
    expect(handle('LDA $a1')).toMatchSnapshot();
  });
  test('simple - zeros', () => {
    expect(handle('LDA $0A')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LDA.b lbl');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA.b 12345');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA.b %0101');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA.b "a"');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA.b "abc"');
    expect(result).toMatchSnapshot();
  });
});

describe('Zero page error', () => {
  test('error when operator is incomplete', () => {
    expect(handle('LD $00')).toMatchSnapshot();
  });
});
