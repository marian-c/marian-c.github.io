import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

describe('bugs', () => {
  test('absolute case for parser matching abs for abx or aby', () => {
    const source = `
LDA $1234
LDA $1235,x
LDA $1236,y
LDA $1237 
LDA $1238;
LDA $1239 ;
LDA $1240;com
LDA $1241 ; com
    `;
    const a = parseSource(source, {
      instructionsInfo: phase2({ LDA: { abs: 4, abx: 5, aby: 6 } }),
    });

    const b = parseSource(source, {
      instructionsInfo: phase2({ LDA: { abs: 4, aby: 6, abx: 5 } }),
    });
    const c = parseSource(source, {
      instructionsInfo: phase2({ LDA: { abx: 5, abs: 4, aby: 6 } }),
    });
    const d = parseSource(source, {
      instructionsInfo: phase2({ LDA: { abx: 5, aby: 6, abs: 4 } }),
    });
    const e = parseSource(source, {
      instructionsInfo: phase2({ LDA: { aby: 6, abs: 4, abx: 5 } }),
    });
    const f = parseSource(source, {
      instructionsInfo: phase2({ LDA: { aby: 6, abx: 5, abs: 4 } }),
    });
    expect(a).toMatchSnapshot();
    expect(a).toStrictEqual(b);
    expect(a).toStrictEqual(c);
    expect(a).toStrictEqual(d);
    expect(a).toStrictEqual(e);
    expect(a).toStrictEqual(f);
  });
});
