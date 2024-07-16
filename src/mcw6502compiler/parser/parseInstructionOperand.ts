import { expected, type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  type ErrorResult,
  makeError,
  type Result,
  ResultKind,
  type SuccessResult,
} from '@/mcw6502compiler/parser/parserTypes';
import {
  type InstructionOperandNode,
  type InstructionOperatorNode,
} from '@/mcw6502compiler/parser/ast';
import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';
import { parseAddressingModeImm } from '@/mcw6502compiler/parser/parseAddressingModeImm';
import { parseAddressingModeAbs } from '@/mcw6502compiler/parser/parseAddressingModeAbs';
import { parseAddressingModeZp0 } from '@/mcw6502compiler/parser/parseAddressingModeZp0';
import { parseAddressingModeAbx } from '@/mcw6502compiler/parser/parseAddressingModeAbx';
import { parseAddressingModeAby } from '@/mcw6502compiler/parser/parseAddressingModeAby';
import { parseAddressingModeZpx } from '@/mcw6502compiler/parser/parseAddressingModeZpx';
import { parseAddressingModeZpy } from '@/mcw6502compiler/parser/parseAddressingModeZpy';
import { parseAddressingModeInd } from '@/mcw6502compiler/parser/parseAddressingModeInd';
import { parseAddressingModeIzx } from '@/mcw6502compiler/parser/parseAddressingModeIzx';
import { parseAddressingModeIzy } from '@/mcw6502compiler/parser/parseAddressingModeIzy';
import { parseAddressingModeRel } from '@/mcw6502compiler/parser/parseAddressingModeRel';

export function parseInstructionOperand(
  stringInput: StringInput,
  config: FinalConfig,
  instruction: InstructionOperatorNode,
): Result<InstructionOperandNode> {
  const trimmed = trimStart(stringInput);
  const instructionValue = instruction.value;
  const possibleAddressingModes = config.instructionsInfo[instructionValue]!.list.filter(
    (v) => v !== 'imp',
  );

  if (!possibleAddressingModes.length) {
    throw new ErrorShouldNotHappen(`Found no addressing mode in config for ${instructionValue}`);
  }
  let operand: SuccessResult<InstructionOperandNode> | undefined = undefined;
  const errors: ErrorResult[] = [];
  for (const possibleAddressingMode of possibleAddressingModes) {
    switch (possibleAddressingMode.toLowerCase()) {
      case 'imm':
        let immOperand = parseAddressingModeImm(trimmed, config);
        if (immOperand.kind !== ResultKind.Error) {
          operand = immOperand;
        } else {
          errors.push(immOperand);
        }
        break;
      case 'abs':
        let absOperand = parseAddressingModeAbs(trimmed, config, instruction);
        if (absOperand.kind !== ResultKind.Error) {
          operand = absOperand;
        } else {
          errors.push(absOperand);
        }
        break;
      case 'abx':
        let abxOperand = parseAddressingModeAbx(trimmed, config, instruction);
        if (abxOperand.kind !== ResultKind.Error) {
          operand = abxOperand;
        } else {
          errors.push(abxOperand);
        }
        break;
      case 'aby':
        let abyOperand = parseAddressingModeAby(trimmed, config, instruction);
        if (abyOperand.kind !== ResultKind.Error) {
          operand = abyOperand;
        } else {
          errors.push(abyOperand);
        }
        break;
      case 'zp0':
        let zp0Operand = parseAddressingModeZp0(trimmed, config, instruction);
        if (zp0Operand.kind !== ResultKind.Error) {
          operand = zp0Operand;
        } else {
          errors.push(zp0Operand);
        }
        break;
      case 'zpx':
        let zpxOperand = parseAddressingModeZpx(trimmed, config, instruction);
        if (zpxOperand.kind !== ResultKind.Error) {
          operand = zpxOperand;
        } else {
          errors.push(zpxOperand);
        }
        break;
      case 'zpy':
        let zpyOperand = parseAddressingModeZpy(trimmed, config, instruction);
        if (zpyOperand.kind !== ResultKind.Error) {
          operand = zpyOperand;
        } else {
          errors.push(zpyOperand);
        }
        break;
      case 'ind':
        let indOperand = parseAddressingModeInd(trimmed, config);
        if (indOperand.kind !== ResultKind.Error) {
          operand = indOperand;
        } else {
          errors.push(indOperand);
        }
        break;
      case 'izx':
        let izxOperand = parseAddressingModeIzx(trimmed, config);
        if (izxOperand.kind !== ResultKind.Error) {
          operand = izxOperand;
        } else {
          errors.push(izxOperand);
        }
        break;
      case 'izy':
        let izyOperand = parseAddressingModeIzy(trimmed, config);
        if (izyOperand.kind !== ResultKind.Error) {
          operand = izyOperand;
        } else {
          errors.push(izyOperand);
        }
        break;
      case 'rel':
        let relOperand = parseAddressingModeRel(trimmed, config);
        if (relOperand.kind !== ResultKind.Error) {
          operand = relOperand;
        } else {
          errors.push(relOperand);
        }
        break;
      default:
        // we should handle all possible operands.
        return makeError(
          `Internal error, possible addressing mode not handled: ${possibleAddressingMode}`,
          [trimmed.index, trimmed.index + trimmed.value.length],
          trimmed.meta.originalLines,
        );
    }
  }

  if (operand === undefined && errors.length) {
    const error = errors.reduce((prev, curr) => {
      return prev.range[0] > curr.range[0] ? prev : curr;
    });
    if (error.range[0] !== trimmed.index) {
      return error;
    }
  }
  // searched all possible operands, error if found nothing
  if (operand === undefined) {
    return expected(
      trimmed,
      `an valid operand for instruction operand (${possibleAddressingModes})`,
    );
  }
  return operand;
}
