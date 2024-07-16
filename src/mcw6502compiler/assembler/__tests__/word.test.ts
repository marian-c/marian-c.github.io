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

describe('word directive', () => {
  test('very simple', () => {
    const prg = ``;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - one line only', () => {
    const prg = `.word $0000`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - one line - non zero', () => {
    const prg = `.word $0001`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - one line - non zero - again', () => {
    const prg = `.word $1234`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - two lines - zero', () => {
    const prg = `.word $0000\n.word $0001`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - two lines - zero - again', () => {
    const prg = `.word $0000\n.word $000A`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test('Simple - two lines - on-zero', () => {
    const prg = `.word $0001\n.word $0002`;
    expect(handle(prg)).toMatchSnapshot();
  });
});
