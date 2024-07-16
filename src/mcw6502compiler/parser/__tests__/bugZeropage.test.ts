import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

describe('bugZeropage', () => {
  test('zeropage case for parser matching zp0 for zpx or xpy', () => {
    const source = `
LDA $34
LDA $35,x
LDA $36,y
LDA $37 
LDA $38;
LDA $39 ;
LDA $40;com
LDA $41 ; com
    `;
    const a = parseSource(source, {
      instructionsInfo: phase2({ LDA: { zp0: 4, zpx: 5, zpy: 6 } }),
    });

    const b = parseSource(source, {
      instructionsInfo: phase2({ LDA: { zp0: 4, zpy: 6, zpx: 5 } }),
    });
    const c = parseSource(source, {
      instructionsInfo: phase2({ LDA: { zpx: 5, zp0: 4, zpy: 6 } }),
    });
    const d = parseSource(source, {
      instructionsInfo: phase2({ LDA: { zpx: 5, zpy: 6, zp0: 4 } }),
    });
    const e = parseSource(source, {
      instructionsInfo: phase2({ LDA: { zpy: 6, zp0: 4, zpx: 5 } }),
    });
    const f = parseSource(source, {
      instructionsInfo: phase2({ LDA: { zpy: 6, zpx: 5, zp0: 4 } }),
    });
    expect(a).toMatchSnapshot();
    expect(a).toStrictEqual(b);
    expect(a).toStrictEqual(c);
    expect(a).toStrictEqual(d);
    expect(a).toStrictEqual(e);
    expect(a).toStrictEqual(f);
  });
});
