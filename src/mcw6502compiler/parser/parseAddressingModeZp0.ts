import { expected, type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  makeError,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import {
  type InstructionOperatorNode,
  NodeKind,
  ValueLiteralKind,
  type Zp0AddressingModeNode,
} from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeZp0(
  stringInput: StringInput,
  config: FinalConfig,
  instruction: InstructionOperatorNode,
): Result<Zp0AddressingModeNode> {
  const suffixValue = instruction.forcedTo;

  const trimmed = trimStart(stringInput);

  const valuableResult = parseValuable(trimmed, config);
  if (valuableResult.kind === ResultKind.Error) {
    return valuableResult;
  }

  const valuable = valuableResult.value;
  let hexLength = null;
  if (
    valuable.kind === NodeKind.valueLiteral &&
    valuable.valueLiteralKind === ValueLiteralKind.hex
  ) {
    hexLength = valuable.originalStringValue.length;
  }

  if (suffixValue !== 'b' && (!hexLength || hexLength > 2)) {
    return makeError(
      'B suffix required for ZP0 mode',
      instruction.range,
      stringInput.meta.originalLines,
    );
  }
  if (suffixValue === 'b' && hexLength && hexLength > 2) {
    return makeError(
      'You can not force to byte (.b) hex literal with length bigger than 2',
      [valuable.range[0] + 1, valuable.range[1]],
      stringInput.meta.originalLines,
    );
  }

  // zp0 syntax is a subset of zpx or xpy
  const rest = valuableResult.rest;
  if (rest.value.startsWith(',')) {
    return expected(rest, 'end of ZP0 mode');
  }

  return makeSuccess<Zp0AddressingModeNode>(
    {
      kind: NodeKind.zp0AddressingMode,
      value: valuableResult.value,
      range: [trimmed.index, valuableResult.rest.index],
    },
    valuableResult.rest,
  );
}
