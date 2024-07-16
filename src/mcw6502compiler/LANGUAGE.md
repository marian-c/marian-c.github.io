# MCW6502 language

This document describes the assembly language as supported by mcw6502

For actual documentation on how the instructions work, you can try:

- https://www.masswerk.at/6502/6502_instruction_set.html
- https://web.archive.org/web/20210426082142/http://www.obelisk.me.uk/6502/

## Whitespace and casing

- multi white space does not matter
- empty lines don't matter
- an empty program is a valid program
- casing does not matter: `BRK` or `brk` or `BrK` are equivalent

## Comments

Comments start with a `;`

```
; this is a comment
```

Comments can also be placed at the end of the line, after other stuff

```
myLabel: ; this is a comment
BRK ; this is a comment
```

## Valuables

We call valuable something that refers to a value, it can be a reference
(to a symbol or label) or a literal

### Reference to symbol

```
some_symbol = $1234 ; `$1234` is the valuable here
; ...
LDA some_symbol ; `some_symbol` is the valuable here
```

### Reference to label

```
location:
; ...
LDA: location
```

### Hex literal

```
LDA $1
LDA $01
LDA $1234
something = $12345
.org $0011
```

### Decimal literal

```
LDA 123
; plus all other examples from Hex literal
```

### Binary literal

```
LDA %1234
; plus all other examples from Hex literal
```

### Ascii char literal

```
LDA "a"
; plus all other examples from Hex literal
```

### Ascii string literal

```
LDA "ab"
; plus all other examples from Hex literal
```

## Label definitions:

Labels definitions are words followed my a `:` immediately

```
myLabel:
```

You can also put a comment on the same line, after the label

```
myLabel: ; describing this line
```

You can not have multiple labels with the same name;

You can use the label before it is defined.

## Symbol definitions

You can assign any valuable to a symbol.

```
my_symbol = $1234;
my_other_symbol = my_symbol;
```

Symbols can not be used before defining them.

## Instructions

### Instructions without operands

Some instructions are simple

```
ROR
```

### Instructions with operands

#### Absolute addressing mode (abs)

The operator can be any valuable except hex literals of length 1 or 2, must fit in 2 bytes

```
LDX $abcd
```

#### Absolute, X-indexed (abx)

The operator can be any valuable except hex literals of length 1 or 2, must fit in 2 bytes

```
LDX $abcd,X
```

#### Absolute, Y-indexed (aby)

The operator can be any valuable except hex literals of length 1 or 2, must fit in 2 bytes

```
LDX $abcd,Y
```

#### Immediate (imm)

The operator can be any valuable, must fit in 1 byte

```
LDA #$a1
```

#### Indirect (ind)

The operator can be any valuable, must fit in 2 bytes

```
LDA ($a1a2)
```

#### X-indexed, indirect (izx)

The operator can be any valuable, must fit in 1 byte

```
LDA ($a1,X)
```

#### Indirect, Y-indexed (izy)

The operator can be any valuable, must fit in 1 byte

```
LDA ($a1),Y
```

#### Relative (rel)

The operator can be any valuable, must fit in 2 bytes

```
BNE existing_label
```

#### Zeropage (zp0)

Either a hex literal with length 1 or 2

```
LDA $a1
```

or any valuable that fits in 1 byte, with forcing suffix

```
LDA.b my_symbol
```

#### Zeropage, X-indexed (zpx)

Either a hex literal with length 1 or 2

```
LDA $a1,x
```

or any valuable that fits in 1 byte, with forcing suffix

```
LDA.b my_symbol,x
```

#### Zeropage, Y-indexed (zpy)

Either a hex literal with length 1 or 2

```
LDA $a1,Y
```

or any valuable that fits in 1 byte, with forcing suffix

```
LDA.b my_symbol,Y
```

## Directives

### The "insert word" directive

The argument can be any valuable, must fit in 2 bytes

```
.word $1234
```

### The "set program counter" directive

> Fill value argument not implemented yet

The argument can be any valuable, must fit in 2 bytes

```
.org $1234
```

You can also set the value to fill the empty space

// TODO: implement the second argument

```
.org $1234 $ea
```

Compilation will fail if there are overwrites; it will also fail if the `.org` directives are not
properly ordered

Empty `.org` directives are possible; The next code fills the area from `$0800` to `$1000` with `$ea`

```
.org $0800
.org $1000 $ea
```

Having the second argument present (the fill value) will have no effect in certain situations, for example:

```
.org $0002 $ea ; fill value has no effect before the first byte
```

Be careful

```
myLbl: ; this is actually $0000, jumping here would make no sense in this example
.org $1000
lda $abcd ; this is $1000
```

## Notes

- labels and symbols are case-insensitive
- labels and symbols share the same namespace and can not be duplicated
- if an .org directive references a label, this is syntactically valid, but
  it would error because of overwrite
- you could reference a label from a variable, that's technically "use before define"
  but that's fine because labels are guaranteed to get resolved in the first pass,
  whereas variables do not have this guarantee
