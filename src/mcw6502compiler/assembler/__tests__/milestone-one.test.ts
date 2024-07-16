import { instructionMatrixToInfo } from '@/mcw6502compiler/instructionMatrixToInfo';
import { lookup } from '@/vendor-in/my-emulator/6502/olc6502_lookup';
import { parseSource } from '@/mcw6502compiler/parser/parse';
import { validateParseTree } from '@/mcw6502compiler/validator/validate';
import { assemble } from '@/mcw6502compiler/assembler/assemble';
import { assertIsGenericResultSuccess } from '@/utils';

const instructionsInfo = instructionMatrixToInfo(lookup);
const config = { instructionsInfo };

function handleWithError(programBody: string) {
  const programResult = parseSource(programBody, config);
  expect(programResult.errors).toHaveLength(0);

  const validationResult = validateParseTree(programResult, config);
  expect(validationResult).toHaveLength(0);

  return assemble(programResult, config);
}
function handle(programBody: string) {
  const output = handleWithError(programBody);
  assertIsGenericResultSuccess(output);
  return {
    startingAddress: output.result.startAddress,
    data: Array.from(output.result.data).map((n) => n.toString(16).padStart(2, '0')),
  };
}
// TODO: errors when various values are too big

describe('milestone one', () => {
  test('debug zero', () => {
    expect(
      handle(`
  LDX $abcd
  start:
  .word start
    `),
    ).toMatchSnapshot();
  });
  test('debug', () => {
    expect(
      handle(`
  lbl = $5
  a = $a
  ab = $abcd
  LDX $abcd
  start:
    LDX ab
  .word start
  .word lbl
  .word $1234
  .word ab
  .word a
    `),
    ).toMatchSnapshot();
  });
  test('one instruction', () => {
    const r1 = handle(`
  .org $1234
    ldx #$ff
    ldx $abcd;
  .org $1240
    ldx #$0f
    JMP $1245
    JMP $1234
    `);
    const r2 = handle(`
    var = $ff
    var_abs = $abcd
  .org $1234
  start:
    ldx #var
    ldx var_abs
  .org $1240
    ldx #%1111
    JMP end
  end:
    JMP start
    `);

    expect(r1).toMatchInlineSnapshot(`
{
  "data": [
    "a2",
    "ff",
    "ae",
    "cd",
    "ab",
    "00",
    "00",
    "00",
    "00",
    "00",
    "00",
    "00",
    "a2",
    "0f",
    "4c",
    "45",
    "12",
    "4c",
    "34",
    "12",
  ],
  "startingAddress": 4660,
}
`);
    expect(r1).toStrictEqual(r2);
  });
});
test('LCD example (no ascii)', () => {
  const prg = `
PORTB = $6000
PORTA = $6001
DDRB = $6002
DDRA = $6003

E  = %10000000
RW = %01000000
RS = %00100000

  .org $8000

reset:
  ldx #$ff
  txs

  lda #%11111111 ; Set all pins on port B to output
  sta DDRB
  lda #%11100000 ; Set top 3 pins on port A to output
  sta DDRA

  lda #%00111000 ; Set 8-bit mode; 2-line display; 5x8 font
  jsr lcd_instruction
  lda #%00001110 ; Display on; cursor on; blink off
  jsr lcd_instruction
  lda #%00000110 ; Increment and shift cursor; don't shift display
  jsr lcd_instruction
  lda #$00000001 ; Clear display
  jsr lcd_instruction

  ldx #0
print:
  lda message,x
  beq loop
  jsr print_char
  inx
  jmp print

loop:
  jmp loop

message: ;.ascii "Hello, world!"

lcd_wait:
  pha
  lda #%00000000  ; Port B is input
  sta DDRB
lcdbusy:
  lda #RW
  sta PORTA
  lda #RW
  sta PORTA
  lda PORTB
  and #%10000000
  bne lcdbusy

  lda #RW
  sta PORTA
  lda #%11111111  ; Port B is output
  sta DDRB
  pla
  rts

lcd_instruction:
  jsr lcd_wait
  sta PORTB
  lda #0         ; Clear RS/RW/E bits
  sta PORTA
  lda #E         ; Set E bit to send instruction
  sta PORTA
  lda #0         ; Clear RS/RW/E bits
  sta PORTA
  rts

print_char:
  jsr lcd_wait
  sta PORTB
  lda #RS         ; Set RS; Clear RW/E bits
  sta PORTA
  lda #RS   ; Set E bit to send instruction
  sta PORTA
  lda #RS         ; Clear E bits
  sta PORTA
  rts

  .org $80A0
  .word reset
  .word $0000 
  `;
  const r = handle(prg);

  expect(r.startingAddress).toEqual(0x8000);
  const expected = `A2 FF 9A A9 FF 8D 02 60
A9 E0 8D 03 60 A9 38 20
55 80 A9 0E 20 55 80 A9
06 20 55 80 A9 01 20 55
80 A2 00 BD 32 80 F0 07
20 6B 80 E8 4C 23 80 4C
2F 80 48 A9 00 8D 02 60
A9 40 8D 01 60 A9 40 8D
01 60 AD 00 60 29 80 D0
EF A9 40 8D 01 60 A9 FF
8D 02 60 68 60 20 32 80
8D 00 60 A9 00 8D 01 60
A9 80 8D 01 60 A9 00 8D
01 60 60 20 32 80 8D 00
60 A9 20 8D 01 60 A9 20
8D 01 60 A9 20 8D 01 60
60 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 80 00 00`
    .split('\n')
    .map((r) => r.split(' '))
    .flat()
    .map((v) => v.toLowerCase());
  expect(r.data).toStrictEqual(expected);
});

describe('errors', () => {
  test('bin too big', () => {
    const r1 = handleWithError(`
      ldx #$FFF
    `);
    expect(r1).toMatchInlineSnapshot(`
{
  "errors": [
    {
      "kind": 1,
      "lineRange": {
        "end": [
          2,
          16,
        ],
        "start": [
          2,
          12,
        ],
      },
      "message": "Value literal does not fit in 1 byte(s)",
      "range": [
        12,
        16,
      ],
    },
  ],
  "kind": 1,
}
`);
  });
});
