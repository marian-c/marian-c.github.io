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

describe('Directive - org', () => {
  test('simple', () => {
    expect(handle(`.org $1234`)).toMatchSnapshot();
  });
  test('simple with space', () => {
    expect(handle(`.org $1234 `)).toMatchSnapshot();
  });
  test('simple with comment', () => {
    expect(handle(`.org $1234 ;comment`)).toMatchSnapshot();
  });
  test('simple with comment but no space', () => {
    expect(handle(`.org $1234;comment`)).toMatchSnapshot();
  });

  test.skip('with symbol', () => {
    // not supported yet
    const result = handle('.org lbl');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('.org 12345');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('.org %0101');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('.org "a"');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('.org "abc"');
    expect(result).toMatchSnapshot();
  });
});

describe('Directive org - errors', () => {
  test('missing address', () => {
    expect(handle(`.org`)).toMatchSnapshot();
  });
  test('missing address and space', () => {
    const source = `
.org
    `;
    expect(handle(source)).toMatchSnapshot();
  });
  test('simple syntax error', () => {
    expect(handle(`.org$`)).toMatchSnapshot();
    expect(handle(`.org.org`)).toMatchSnapshot();
  });
  test('directive name not recognized', () => {
    expect(handle(`.orgg`)).toMatchSnapshot();
    expect(handle(`.orgg    `)).toMatchSnapshot();
  });

  test('unrecognised address', () => {
    expect(handle(`.org -ads`)).toMatchSnapshot();
  });
  test('valid address but no space A', () => {
    expect(handle(`.org$1234`)).toMatchSnapshot();
  });
  test('valid address but no space B', () => {
    expect(handle(`.org $1234$`)).toMatchSnapshot();
  });
});
