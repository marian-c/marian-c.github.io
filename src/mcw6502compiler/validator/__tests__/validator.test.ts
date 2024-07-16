import { parseSource } from '@/mcw6502compiler/parser/parse';
import { validateParseTree } from '@/mcw6502compiler/validator/validate';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

const instructionsInfo = phase2({
  BRK: { IMP: 1 },
  BNE: { REL: 2 },
});

function handle(programBody: string) {
  const config = { instructionsInfo };
  const programResult = parseSource(programBody, config);
  const validationResult = validateParseTree(programResult, config);
  return { programResult, validationResult };
}

describe('Validator', () => {
  test('Positive - empty', () => {
    const { programResult, validationResult } = handle(``);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });

  test('Positive - label defined first', () => {
    const { programResult, validationResult } = handle(`
    start:
    bne start
    `);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });

  test('Positive - label referenced first', () => {
    const { programResult, validationResult } = handle(`
bne start
start:
    `);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });

  test('Error when duplicate labels', () => {
    const { programResult, validationResult } = handle(`
start:
start: ; same label
    `);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });

  test('Error when duplicate symbols', () => {
    const { programResult, validationResult } = handle(`
my_symbol = 1
my_symbol = 2
    `);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });
  test('Error when duplicate symbols + labels', () => {
    const { programResult, validationResult } = handle(`
my_symbol = 1
my_symbol: 
BRK
    `);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });

  test('no error when label does not exist (handled by the assembler)', () => {
    const { programResult, validationResult } = handle(`
bne missing
existing:
    `);
    expect(programResult.errors).toHaveLength(0);
    expect(validationResult).toMatchSnapshot();
  });
});
