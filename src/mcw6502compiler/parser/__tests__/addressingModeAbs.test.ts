import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { abs: 4 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('Absolute mode', () => {
  test('simple - len 4', () => {
    expect(handle('LDA $a1a1')).toMatchSnapshot();
  });
  test('simple - zeros', () => {
    expect(handle('LDA $00B1')).toMatchSnapshot();
  });
  test('with symbol', () => {
    const result = handle('LDA SR');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA 12');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA %0101');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA "a"');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA "abc"');
    expect(result).toMatchSnapshot();
  });
  test('accept dev with leading 0', () => {
    const result = handle('LDA 0121');
    expect(result).toMatchSnapshot();
  });
});

describe('Absolute mode error', () => {
  test('error when operator is incomplete', () => {
    expect(handle('LD $00B1')).toMatchSnapshot();
  });
  test('error when decimal is funky', () => {
    const result = handle('LDA -12');
    expect(result).toMatchSnapshot();
  });
  test('error when decimal is funky after', () => {
    const result = handle('LDA 12 1');
    expect(result).toMatchSnapshot();
  });
  test('error when ascii is incomplete', () => {
    const result = handle('LDA "abc');
    expect(result).toMatchSnapshot();
  });
});
