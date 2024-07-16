import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5, imm: 6 },
});

function handle(s: string) {
  return parseSource(s, { instructionsInfo });
}

describe('imm addressing mode', () => {
  test('simples', () => {
    expect(handle('LDA #$a1 ')).toMatchSnapshot();
  });
  test('simple 2', () => {
    const r = handle('LdA #$01;');
    expect(r).toMatchSnapshot();
  });
  test('allow single digit address', () => {
    // TODO: validation should fail here though because instruction is not forced `LDA.b #$0`
    expect(handle('LdA #$0')).toMatchSnapshot();
  });
  test('allow 4 digit address', () => {
    // TODO: validation should fail here though because instruction is not forced `LDA.b #$0001`
    expect(handle('LDA #$0001')).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('LDA #SR');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('LDA #12');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('LDA #%0101');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('LDA #"a"');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('LDA #"abc"');
    expect(result).toMatchSnapshot();
  });
});

describe('Immediate mode errors', () => {
  test('errors', () => {
    expect(
      handle(`
      
      
LDA #@01,
          
LDA #$MM
    `),
    ).toMatchSnapshot();
  });
});
