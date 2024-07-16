import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';
import { parseSource } from '@/mcw6502compiler/parser/parse';

const config = {
  instructionsInfo: phase2({
    AAA: { ABS: 1 },
    AAX: { ABX: 17 },
    AAY: { ABY: 18 },
    BBB: { ABS: 2, ZP0: 3 },
    BBX: { ABX: 19, ZPX: 20 },
    BBY: { ABS: 21, ABY: 22, ZP0: 23, ZPY: 24 },
    CCC: { ABS: 4 },
    HHH: { ABS: 25, IMM: 26 },
    DDD: { ABS: 6, IMM: 7 },
    DDX: { ABX: 13, IMM: 14 },
    DDY: { ABY: 15, IMM: 16 },
    EEE: { REL: 9 },
    FFF: { IMM: 10 },
    GGG: { ABS: 11, IMM: 12 },
    III: { ZP0: 27, IMM: 28 },
  }),
};

describe('Forced suffix:', () => {
  test('OK, immediate', () => {
    const result = parseSource(
      `
DDD #SR
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('OK, immediate (abx)', () => {
    const result = parseSource(
      `
DDX #SR
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('OK, immediate (aby)', () => {
    const result = parseSource(
      `
DDY #SR
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('OK, assumed 4 bytes', () => {
    const result = parseSource(
      `
AAA SR
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('OK, assumed 4 bytes (abx)', () => {
    const result = parseSource(
      `
AAX SR,x
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('OK, assumed 4 bytes (aby)', () => {
    const result = parseSource(
      `
AAY SR,y
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('ERROR this is zp0 syntax', () => {
    const result = parseSource(
      `
GGG $12
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('ERROR incomplete', () => {
    const result = parseSource(
      `
GGG $
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('ERROR this is ZPX syntax', () => {
    const result = parseSource(
      `
GGG $12,x
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('ERROR this is ZPY syntax', () => {
    const result = parseSource(
      `
GGG $12,y
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });

  describe('bbb', () => {
    test('OK, ABS, assumed 4 bytes', () => {
      const result = parseSource(
        `
BBB SRR
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ABS, known 4 bytes', () => {
      const result = parseSource(
        `
BBB $1234 ; OK, ABS, known 4 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZP0, known 2 bytes', () => {
      const result = parseSource(
        `
BBB $12 ; OK, ZP0, known 2 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZP0, known 1 byte', () => {
      const result = parseSource(
        `
BBB $1 ; OK, ZP0, known 1 byte
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZP0, forced 2 bytes', () => {
      const result = parseSource(
        `
BBB.b symbol ; OK, ZP0, forced 2 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('ERROR forcing an absolute address', () => {
      const result = parseSource(
        `
BBB.b $1234 ; ERROR forcing an absolute address
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
  });
  describe('bbx', () => {
    test('OK, ABX, assumed 4 bytes', () => {
      const result = parseSource(
        `
BBX SRR,x
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ABX, known 4 bytes', () => {
      const result = parseSource(
        `
BBX $1234,x ; OK, ABX, known 4 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZPX, known 2 bytes', () => {
      const result = parseSource(
        `
BBX $12,x ; OK, ZPX, known 2 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZPX, known 1 byte', () => {
      const result = parseSource(
        `
BBX $1,x ; OK, ZPX, known 1 byte
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZPX, forced 2 bytes', () => {
      const result = parseSource(
        `
BBX.b symbol,x ; OK, ZPX, forced 2 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('ERROR forcing an ABX address', () => {
      const result = parseSource(
        `
BBX.b $123,x ; ERROR forcing an ABX address
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
  });
  describe('bby', () => {
    test('OK, ABY, assumed 4 bytes', () => {
      const result = parseSource(
        `
BBY SRR,y
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ABY, known 4 bytes', () => {
      const result = parseSource(
        `
BBY $1234,y ; OK, ABY, known 4 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZPY, known 2 bytes', () => {
      const result = parseSource(
        `
BBY $12,y ; OK, ZPY, known 2 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZPY, known 1 byte', () => {
      const result = parseSource(
        `
BBY $1,y ; OK, ZPY, known 1 byte
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('OK, ZPY, forced 2 bytes', () => {
      const result = parseSource(
        `
BBY.b symbol,y ; OK, ZPY, forced 2 bytes
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
    test('ERROR forcing an ABY address', () => {
      const result = parseSource(
        `
BBY.b $1234,y ; ERROR forcing an ABY address
        `,
        config,
      );
      expect(result).toMatchSnapshot();
    });
  });

  test('ERROR, zp modes not available for this instruction (2)', () => {
    const result = parseSource(
      `
HHH.b symbol
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('ERROR, zp modes not available for this instruction', () => {
    const result = parseSource(
      `
CCC.b symbol ; ERROR, zp modes not available for this instruction 
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('REL mode still works', () => {
    const result = parseSource(
      `
EEE $122
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('REL errors if it looks like zp0', () => {
    const result = parseSource(
      `
EEE $12
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('Can not force an instruction that has no zp0 mode', () => {
    const result = parseSource(
      `
DDD.b symbol
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('Allow forcing of zp literal with length 2', () => {
    const result = parseSource(
      `
BBB.b $12
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('Disallow forcing outside of ZP modes', () => {
    const result = parseSource(
      `
EEE.b #$12
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
  test('Some error', () => {
    const result = parseSource(
      `
III.b #$12
        `,
      config,
    );
    expect(result).toMatchSnapshot();
  });
});
