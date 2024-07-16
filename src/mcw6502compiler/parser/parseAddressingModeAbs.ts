import { expected, type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  makeError,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import {
  type AbsAddressingModeNode,
  type InstructionOperatorNode,
  NodeKind,
  ValueLiteralKind,
} from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeAbs(
  stringInput: StringInput,
  config: FinalConfig,
  instruction: InstructionOperatorNode,
): Result<AbsAddressingModeNode> {
  const suffixValue = instruction.forcedTo;
  if (suffixValue === 'b') {
    return makeError(
      'ABS addressing mode can not be forced to byte',
      instruction.range,
      stringInput.meta.originalLines,
    );
  }
  const trimmed = trimStart(stringInput);

  const valuableResult = parseValuable(trimmed, config);
  if (valuableResult.kind === ResultKind.Error) {
    return valuableResult;
  }

  // abs syntax is a subset of abx or aby
  const rest = valuableResult.rest;
  if (rest.value.startsWith(',')) {
    return expected(rest, 'end of ABS mode');
  }

  const valuable = valuableResult.value;
  let hexLength = null;
  if (
    valuable.kind === NodeKind.valueLiteral &&
    valuable.valueLiteralKind === ValueLiteralKind.hex
  ) {
    hexLength = valuable.originalStringValue.length;
  }
  if (hexLength === 2 || hexLength === 1) {
    return makeError(
      'Hex literals must not have length 1 or 2 for ABS mode',
      [valuable.range[0] + 1, valuable.range[1]],
      stringInput.meta.originalLines,
    );
  }

  return makeSuccess<AbsAddressingModeNode>(
    {
      kind: NodeKind.absAddressingMode,
      value: valuableResult.value,
      range: [trimmed.index, rest.index],
    },
    valuableResult.rest,
  );
}
