import { instructionMatrixToInfo } from '@/mcw6502compiler/instructionMatrixToInfo';
import { lookup } from '@/vendor-in/my-emulator/6502/olc6502_lookup';
import { parseSource } from '@/mcw6502compiler/parser/parse';
import { validateParseTree } from '@/mcw6502compiler/validator/validate';
import { assemble } from '@/mcw6502compiler/assembler/assemble';
import { GenericResultKind } from '@/types';

const instructionsInfo = instructionMatrixToInfo(lookup);
const config = { instructionsInfo };

function handle(programBody: string) {
  const programResult = parseSource(programBody, config);
  expect(programResult.errors).toHaveLength(0);

  const validationResult = validateParseTree(programResult, config);
  expect(validationResult).toHaveLength(0);

  const output = assemble(programResult, config);
  if (output.kind === GenericResultKind.success) {
    return {
      startingAddress: output.result.startAddress,
      data: Array.from(output.result.data).map((n) => n.toString(16).padStart(2, '0')),
    };
  }
  return output;
}

describe('When the org directive overwrites, it must error', () => {
  test.todo('label:\n.org label\n LDA $abcd');
  test('when not forward enough', () => {
    const prg = `LDA $abcd\n.org $0001`;
    expect(handle(prg)).toMatchInlineSnapshot(`
{
  "errors": [
    {
      "kind": 1,
      "lineRange": {
        "end": [
          2,
          11,
        ],
        "start": [
          2,
          1,
        ],
      },
      "message": ".org directive referenced an address behind the current PC (diff: -2)",
      "range": [
        10,
        20,
      ],
    },
  ],
  "kind": 1,
}
`);
  });
  test('when going before last one', () => {
    const prg = `.org $0002 \n LDA $abcd \n .org $0001`;
    expect(handle(prg)).toMatchInlineSnapshot(`
{
  "errors": [
    {
      "kind": 1,
      "lineRange": {
        "end": [
          3,
          12,
        ],
        "start": [
          3,
          2,
        ],
      },
      "message": ".org directive referenced an address behind the current PC (diff: -4)",
      "range": [
        25,
        35,
      ],
    },
  ],
  "kind": 1,
}
`);
  });

  test('consecutive', () => {
    expect(handle(`.org $0002\n.org $0001`)).toMatchInlineSnapshot(`
{
  "errors": [
    {
      "kind": 1,
      "lineRange": {
        "end": [
          2,
          11,
        ],
        "start": [
          2,
          1,
        ],
      },
      "message": ".org directive referenced an address behind the current PC (diff: -1)",
      "range": [
        11,
        21,
      ],
    },
  ],
  "kind": 1,
}
`);
  });

  test('Same address should work', () => {
    expect(handle(`.org $0002\n.org $0002`)).toMatchInlineSnapshot(`
{
  "data": [],
  "startingAddress": 2,
}
`);
    expect(handle(`.org $0002\nLDA $abcd\n.org $0005\nLDA $abcd`)).toMatchInlineSnapshot(`
{
  "data": [
    "ad",
    "cd",
    "ab",
    "ad",
    "cd",
    "ab",
  ],
  "startingAddress": 2,
}
`);
  });
});
