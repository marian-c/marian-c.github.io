import { instructionMatrixToInfo } from '@/mcw6502compiler/instructionMatrixToInfo';
import { lookup } from '@/vendor-in/my-emulator/6502/olc6502_lookup';
import { parseSource } from '@/mcw6502compiler/parser/parse';

const instructionsInfo = instructionMatrixToInfo(lookup);
const config = { instructionsInfo };

describe.skip('____:', () => {
  test.only('__', () => {
    const source = `LDA symbol`;
    // const source = `symbol = $1234`;
    // const source = `symbol = 123`;
    // const source = `symbol = $1234`;
    // const source = `symbol = %1010101`;
    // const source = `symbol = "a"`;
    // const source = `symbol = "abc`;
    // const source = `symbol = another_symbol_or_label`;
    // const source = `symbol = $1234`;
    console.log('parsed', JSON.stringify(parseSource(source, config), null, 2));
  });
});
