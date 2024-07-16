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

describe('Assembler - positive - addressing modes', () => {
  test('abs', () => {
    const source = `
BIT $abcd
    `;
    expect(handle(source)).toMatchSnapshot();
  });

  test('abx', () => {
    const source = `
LDA $abcd,x
    `;
    expect(handle(source)).toMatchSnapshot();
  });
  test('aby', () => {
    const source = `
LDA $abcd,y
    `;
    expect(handle(source)).toMatchSnapshot();
  });

  test('accumulator (imp)', () => {
    const source = `
      ASL
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
  test('imp', () => {
    const source = `
      php
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
  test('imm', () => {
    const source = `
      LDA #$AB
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });

  test('ind', () => {
    const source = `
      JMP ($ABCD)
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
  test('ixz', () => {
    const source = `
      LDA ($AB,x)
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
  test('ixy', () => {
    const source = `
      lda ($AB),y
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });

  test('zp0', () => {
    const source = `
      LDX $AB
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
  test('zpx', () => {
    const source = `
      LDY $AB,x
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
  test('zpy', () => {
    const source = `
      LDX $AB,y
    `;

    const output = handle(source);
    expect(output).toMatchSnapshot();
  });
});

describe.skip('examples', () => {
  test('Positive - easy6502 example 1', () => {
    expect(
      handle(`
      LDA #$01
      STA $0200
      LDA #$05
      STA $0201
      LDA #$08
      STA $0202
    `),
    ).toMatchInlineSnapshot();
  });
  test('Positive - easy6502 example 2', () => {
    expect(
      handle(`
LDA #$c0  ;Load the hex value $c0 into the A register
TAX       ;Transfer the value in the A register to X
INX       ;Increment the value in the X register
ADC #$c4  ;Add the hex value $c4 to the A register
BRK       ;Break - we're done
    `),
    ).toMatchInlineSnapshot();
  });
  test('Positive - label definition after', () => {
    expect(
      handle(`
increment:
  BNE decrement
decrement:
lda #$f1

    `),
    ).toMatchInlineSnapshot();
  });
  test('Positive - label definition after plus one', () => {
    expect(
      handle(`
increment:
  BNE decrement
lda #$f1
decrement:
LDA #$f2

    `),
    ).toMatchInlineSnapshot();
  });
  test('Positive - label definition after plus one and different offset', () => {
    expect(
      handle(`
increment:
  BNE decrement
lda $f100
decrement:
LDA #$f2

    `),
    ).toMatchInlineSnapshot();
  });

  test('Positive - label definition before', () => {
    expect(
      handle(`
decrement:
increment:
  BNE decrement
lda $f100
LDA #$f2

    `),
    ).toMatchInlineSnapshot();
  });

  test('Positive - label definition before (2)', () => {
    expect(
      handle(`
decrement:
  lda $f100
increment:
  BNE decrement
LDA #$f2

    `),
    ).toMatchInlineSnapshot();
  });

  test('Positive - easy6502 example - branching and labels', () => {
    expect(
      handle(`
  LDX #$08
decrement:
  DEX
  STX $0200
  CPX #$03
  BNE decrement
  STX $0201
  BRK
    `),
    ).toMatchInlineSnapshot();
  });
});
