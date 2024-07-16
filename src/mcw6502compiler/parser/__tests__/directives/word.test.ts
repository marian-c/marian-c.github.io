import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

const instructionsInfo = {
  BRK: { IMP: 1 },
  ROR: { IMP: 2 },
  INX: { IMP: 3 },
  LDA: { aby: 6, abs: 4, abx: 5, imm: 6, ind: 7 },
};

function handle(s: string) {
  return parseSource(s, { instructionsInfo: phase2(instructionsInfo) });
}

describe('Directive - word', () => {
  test('simple', () => {
    expect(handle(`.word $1234`)).toMatchSnapshot();
  });
  test('simple with space', () => {
    expect(handle(`.word $1234 `)).toMatchSnapshot();
  });
  test('simple with comment', () => {
    expect(handle(`.word $1234 ;comment`)).toMatchSnapshot();
  });
  test('simple with comment but no space', () => {
    expect(handle(`.word $1234;comment`)).toMatchSnapshot();
  });

  test('with symbol', () => {
    const result = handle('.word lbl');
    expect(result).toMatchSnapshot();
  });
  test('with decimal', () => {
    const result = handle('.word 12345');
    expect(result).toMatchSnapshot();
  });
  test('with binary', () => {
    const result = handle('.word %0101');
    expect(result).toMatchSnapshot();
  });
  test('with ascii', () => {
    const result = handle('.word "a"');
    expect(result).toMatchSnapshot();
  });
  test('with ascii - multiple', () => {
    const result = handle('.word "abc"');
    expect(result).toMatchSnapshot();
  });
});

describe('Directive word - errors', () => {
  test('missing value', () => {
    expect(handle(`.word`)).toMatchSnapshot();
  });
  test('missing value and space', () => {
    const source = `
.org
    `;
    expect(handle(source)).toMatchSnapshot();
  });
  test('simple syntax error', () => {
    expect(handle(`.word$`)).toMatchSnapshot();
    expect(handle(`.word.org`)).toMatchSnapshot();
  });
  test('directive name not recognized', () => {
    expect(handle(`.wordd`)).toMatchSnapshot();
    expect(handle(`.wordd    `)).toMatchSnapshot();
  });

  test('unrecognised value', () => {
    expect(handle(`.word -ads`)).toMatchSnapshot();
    expect(handle(`.word $1`)).toMatchSnapshot();
    expect(handle(`.word $12`)).toMatchSnapshot();
    expect(handle(`.word $123`)).toMatchSnapshot();
    expect(handle(`.word $12345`)).toMatchSnapshot();
  });
  test('valid value but no space ', () => {
    expect(handle(`.word$1234`)).toMatchSnapshot();
    expect(handle(`.word $1234$`)).toMatchSnapshot();
  });
});
