import { instructionMatrixToInfo } from '@/mcw6502compiler/instructionMatrixToInfo';
import { lookup } from '@/vendor-in/my-emulator/6502/olc6502_lookup';
import { parseSource } from '@/mcw6502compiler/parser/parse';
import { validateParseTree } from '@/mcw6502compiler/validator/validate';
import { assemble } from '@/mcw6502compiler/assembler/assemble';
import { assertIsGenericResultSuccess } from '@/utils';

const instructionsInfo = instructionMatrixToInfo(lookup);
const config = { instructionsInfo };

function handle(programBody: string) {
  const programResult = parseSource(programBody, config);
  expect(programResult.errors).toHaveLength(0);

  const validationResult = validateParseTree(programResult, config);
  expect(validationResult).toHaveLength(0);

  const output = assemble(programResult, config);
  assertIsGenericResultSuccess(output);
  return {
    startingAddress: output.result.startAddress,
    data: Array.from(output.result.data).map((n) => n.toString(16).padStart(2, '0')),
  };
}

describe('Org directive', () => {
  test('very simple', () => {
    const prg = ``;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - one line only', () => {
    const prg = `.org $0000`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - one line - non zero', () => {
    const prg = `.org $0001`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - one line - non zero - again', () => {
    const prg = `.org $000a`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - two lines - zero', () => {
    const prg = `.org $0000\n.org $0001`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - two lines - zero - again', () => {
    const prg = `.org $0000\n.org $000A`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - two lines - on-zero', () => {
    const prg = `.org $0001\n.org $0002`;
    expect(handle(prg)).toMatchSnapshot();
  });

  describe('instruction first', () => {
    test('Simple - no effect', () => {
      expect(handle(`lda $1234\n.org $0003`)).toMatchSnapshot();
    });
    test('Simple - fill', () => {
      expect(handle(`lda $1234\n.org $0005`)).toMatchSnapshot();
    });
  });
  describe('instruction after', () => {
    test('Simple - no effect', () => {
      expect(handle(`.org $0000\nlda $1234`)).toMatchSnapshot();
    });
    test('Simple', () => {
      expect(handle(`.org $0005\nlda $1234`)).toMatchSnapshot();
    });
    test('Not so simple', () => {
      expect(handle(`.org $0005\n.org $000a\nlda $1234`)).toMatchSnapshot();
    });
  });

  describe('Instruction before and after', () => {
    test('Simple', () => {
      expect(handle(`LDA $1234\n.org $000a\nLDA $abcd`)).toMatchSnapshot();
    });
  });
});
