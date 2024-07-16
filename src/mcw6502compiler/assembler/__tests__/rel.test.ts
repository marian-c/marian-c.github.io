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
  return Array.from(output.result.data).map((n) => n.toString(16).padStart(2, '0'));
}

describe('Relative mode', () => {
  test('with address', () => {
    const prg = `asd:
BNE asd
BNE $0000
BNE $0003
BNE $0006
BNE $0009
BNE $000c
BNE $000f`;
    expect(handle(prg)).toMatchSnapshot();
  });
  test.todo('branch destination to far away');
});
