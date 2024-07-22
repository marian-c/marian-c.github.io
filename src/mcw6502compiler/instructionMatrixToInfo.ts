import type { Instruction } from '@/vendor-in/my-emulator/6502/olc6502_lookup_types';
import type { InstructionsInfo } from '@/mcw6502compiler/config';
import { sureAccess } from '@/helpers/objects';

export function phase2(phase1: Record<string, Record<string, number>>): InstructionsInfo {
  // TODO: error if relative and (absolute or zp0) mode are configured for the same instruction
  //  they are syntactically incompatible, although the 6502 does not fall into this situation,
  return Object.fromEntries(
    Object.entries(phase1).map(([instructionName, config]) => {
      return [instructionName, { opCodes: config, list: Object.keys(config) }];
    }),
  );
}

/**
 * given an instruction matrix, produce the instructionsInfo to be used by the compiler
 */
export const instructionMatrixToInfo = (matrix: Instruction[]): InstructionsInfo => {
  const phase1 = matrix.reduce(
    (acc, el, idx) => {
      const [instructionName, _, addressingModeFn] = el;
      const addresingMode = addressingModeFn.fName;
      if (acc[instructionName] === undefined) {
        acc[instructionName] = {};
      }
      sureAccess(acc, instructionName)[addresingMode] = idx;
      return acc;
    },
    {} as Record<string, Record<string, number>>,
  );

  return phase2(phase1);
};
