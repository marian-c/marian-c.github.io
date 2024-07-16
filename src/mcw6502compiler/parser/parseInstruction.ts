import { expected, type StringInput, testRegExp } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  makeError,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import {
  InstructionKind,
  type InstructionNode,
  type InstructionWithOperandNode,
  type InstructionWithoutOperandNode,
  NodeKind,
} from '@/mcw6502compiler/parser/ast';
import { parseInstructionOperator } from '@/mcw6502compiler/parser/parseInstructionOperator';
import { emptyRegExp } from '@/mcw6502compiler/parser/regExp';
import { parseComment } from '@/mcw6502compiler/parser/parseComment';
import { parseInstructionOperand } from '@/mcw6502compiler/parser/parseInstructionOperand';

export function parseInstruction(
  stringInput: StringInput,
  config: FinalConfig,
): Result<InstructionNode> {
  const operatorResult = parseInstructionOperator(stringInput, config);
  if (operatorResult.kind === ResultKind.Error) {
    return operatorResult;
  }

  const instructionValue = operatorResult.value.value;
  const possibleAddressingModes = config.instructionsInfo[instructionValue]!.list;

  let rest = operatorResult.rest;

  const isEndOfLine = testRegExp(rest, emptyRegExp);
  const initialCommentResult = parseComment(rest, config);
  const isOperandMissing = isEndOfLine || initialCommentResult.kind !== ResultKind.Error;
  const couldBeImplied = possibleAddressingModes.includes('imp');
  const onlyImplied = possibleAddressingModes.length === 1 && possibleAddressingModes[0] === 'imp';

  if (isOperandMissing && !couldBeImplied) {
    return expected(rest, 'an operand');
  }

  if ((isOperandMissing && couldBeImplied) || onlyImplied) {
    // there should not be any suffix
    if (operatorResult.value.forcedTo !== undefined) {
      return makeError(
        'Unexpected operator suffix for implied mode',
        [rest.index - operatorResult.value.forcedTo.length - 1, rest.index],
        stringInput.meta.originalLines,
      );
    }
    return makeSuccess<InstructionWithoutOperandNode>(
      {
        kind: NodeKind.instruction,
        instructionKind: InstructionKind.withoutOperand,
        operator: operatorResult.value,
        range: [operatorResult.value.range[0], rest.index],
      },
      rest,
    );
  }

  const operandResult = parseInstructionOperand(operatorResult.rest, config, operatorResult.value);

  if (
    operatorResult.value.forcedTo === 'b' &&
    !possibleAddressingModes.some((pam) => ['zp0', 'zpx', 'zpy'].includes(pam))
  ) {
    return makeError(
      'Instruction can not be forced to byte (`.b`)',
      operatorResult.value.range,
      stringInput.meta.originalLines,
    );
  }

  if (operandResult.kind === ResultKind.Error) {
    return operandResult;
  }

  if (
    operatorResult.value.forcedTo === 'b' &&
    operandResult.value.kind !== NodeKind.zp0AddressingMode &&
    operandResult.value.kind !== NodeKind.zpxAddressingMode &&
    operandResult.value.kind !== NodeKind.zpyAddressingMode
  ) {
    return makeError(
      'Forcing to byte (`.b`) is only allowed for ZP modes',
      operatorResult.value.range,
      stringInput.meta.originalLines,
    );
  }

  rest = operandResult.rest;
  return makeSuccess<InstructionWithOperandNode>(
    {
      kind: NodeKind.instruction,
      instructionKind: InstructionKind.withOperand,
      operator: operatorResult.value,
      range: [operatorResult.value.range[0], rest.index],
      operand: operandResult.value,
    },
    rest,
  );
}
