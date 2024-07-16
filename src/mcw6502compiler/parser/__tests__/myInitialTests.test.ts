import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

const instructionsInfo = phase2({
  BRK: { IMP: 1 }, // implied
  IMM: { IMM: 2 }, // fake test instruction
  ZPZ: { ZP0: 3 }, // fake test instruction
  ABS: { ABS: 4 }, // fake test instruction
  ZPX: { ZPX: 5 }, // fake test instruction
  ZPY: { ZPY: 6 }, // fake test instruction
  ABX: { ABX: 7 }, // fake test instruction
  ABY: { ABY: 8 }, // fake test instruction
  IND: { IND: 9 }, // fake test instruction
  IZX: { IZX: 10 }, // fake test instruction
  IZY: { IZY: 11 }, // fake test instruction
  BNE: { REL: 12 },
  LDX: {
    IMM: 13,
    ABS: 14,
    ZP0: 15,
  },

  LDA: {
    IMM: 17,
    ABS: 18,
    ZPX: 19,
    ZPY: 20,
    ABX: 21,
    ABY: 22,
  },
});

describe('Basic tests', () => {
  test('Ignore empty lines', () => {
    expect(
      parseSource(
        `
BRK
  
BRK
    
BRK
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Two valid instruction with IMM mode', () => {
    expect(
      parseSource(
        `BRK
BRK`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('One valid instruction with IMM mode', () => {
    expect(
      parseSource(`BRK`, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();

    expect(
      parseSource(` BRK`, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();

    expect(
      parseSource(`  BRK`, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();

    expect(
      parseSource(`BRK  `, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();

    expect(
      parseSource(`   BRK  `, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();
  });

  test('One semantically invalid instruction with IMM mode after a valid instruction', () => {
    expect(
      parseSource(
        `BRK
    ASD`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('One syntactically invalid instruction with IMM mode before a valid instruction', () => {
    expect(
      parseSource(
        `BRK
    BR`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Multi invalid instruction with IMM mode', () => {
    expect(
      parseSource(
        `BRK
    BR
    ASD
    BRK
    BA`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('One syntactically invalid instruction with IMM mode', () => {
    expect(
      parseSource(`BR`, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();

    expect(
      parseSource(`BR K`, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();
  });

  test('One semantically invalid instruction with IMM mode', () => {
    const result = parseSource(`ADC`, {
      instructionsInfo,
    });

    expect(result).toMatchSnapshot();
  });

  test(`Empty source`, () => {
    expect(
      parseSource(``, {
        instructionsInfo,
      }),
    ).toMatchSnapshot();
    expect(
      parseSource(
        `
    

`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('Two separate instructions, one with immediate addressing mode', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
BRK
LDX #$c0
brk
ldx #$C1
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Error if operand is missing', () => {
    expect(
      parseSource(
        `
LDX
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Error if operand is present', () => {
    expect(
      parseSource(
        `
BRK #$c1
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Syntax error for operand', () => {
    expect(
      parseSource(
        `
LDX #$ccc
LDX #cc
LDX asdasd
LDX #$ck
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('Absolute mode', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
  LDA $0101    
  

  
LDA   $01aA
  LDA $0111  
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Negative', () => {
    expect(
      parseSource(
        `
LDA $N
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('Zero page mode', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
  ZPz $11    
  ZPz $01    
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Negative', () => {
    expect(
      parseSource(
        `
    ZPz $n
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('abx aby zpx zpy', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
ABX $aabb,x
ABY $bbcc,y  
ZPX $ab,x
ZPY $bc,y
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Negative', () => {
    expect(
      parseSource(
        `
ABX $aabb,y
ABY $bbcc,X  
ZPX $ab,y
ZPY $bc,x
abx
aby
zpx
zpy
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});
describe('IND', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
IND ($aabb)
IND ($0bbc)  
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Negative', () => {
    expect(
      parseSource(
        `
IND $aabb,y
IND $bbcc,X
IND $abc
IND $ab  
ind $ab,y
ind $bc,x
IND
abs ($abab)
BRK ($abab)
          
       
INDa
aind ($abab)
IND ($abab))
          
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('IZX and IZY', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
IZX ($ab,X)
IZY ($0c),Y  
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('Negative', () => {
    expect(
      parseSource(
        `
    IZX ($,X)
IZY ($),Y  
IZX ($n),x
IZY ($n,Y)  
          
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('Comments', () => {
  test('Simple', () => {
    expect(
      parseSource(
        `
        ; this is a comment
        ;
        LDX #$ab
        ;;
        `,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test('inline', () => {
    expect(
      parseSource(
        `
    IZX ($ab,X);
IZY ($0c),Y  ;
    IZX ($ab,X); comment 4
IZY ($0c),Y  ;comment 5

`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Negative', () => {
    expect(
      parseSource(
        `
    IZX (;$aabb,X)
    IZY ($n),Y  ;comment 5
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('Relative addressing mode', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
    BNE $abcd
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Negative', () => {
    expect(
      parseSource(
        `
    BNE $nå
    ABS $n
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
});

describe('Label definition', () => {
  test('Positive', () => {
    expect(
      parseSource(
        `
    label1: ;test
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Positive2', () => {
    expect(
      parseSource(
        `
start: ;some comment
  BNE $aabb
  LDA #$aa
notequal:
  BRK
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Negative', () => {
    expect(
      parseSource(
        `
notequal
notequal :
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test.todo('Error when double label');
});

describe('Label reference', () => {
  test('Positive0', () => {
    expect(
      parseSource(
        `
  BNE notequal ; some comment
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });
  test('Positive', () => {
    expect(
      parseSource(
        `
start: ;some comment
  BNE notequal ; some comment
  LDA #$aa
notequal:
  BRK
`,
        {
          instructionsInfo,
        },
      ),
    ).toMatchSnapshot();
  });

  test.todo('Error when referencing non existing label');
});

describe('Implied addressing mode', () => {
  test('Instruction can have IMP addressing mode as well as others', () => {
    expect(
      parseSource(
        `
ASL
ASL $FF
    `,
        {
          instructionsInfo: phase2({
            ASL: {
              ZP0: 1,
              IMP: 2,
            },
          }),
        },
      ),
    ).toMatchSnapshot();
  });
});
