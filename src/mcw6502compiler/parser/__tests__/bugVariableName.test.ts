import { parseSource } from '@/mcw6502compiler/parser/parse';
import { phase2 } from '@/mcw6502compiler/instructionMatrixToInfo';

test('variable names should allow underscores', () => {
  const source = `
var_name = $abcd
LDA var_name
    `;
  const a = parseSource(source, {
    instructionsInfo: phase2({ LDA: { abs: 4, abx: 5, aby: 6 } }),
  });
  expect(a).toMatchSnapshot();
});
