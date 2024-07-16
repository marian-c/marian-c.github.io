import {
  expected,
  type StringInput,
  substr,
  trimStart,
} from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  makeError,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import {
  type AbyAddressingModeNode,
  type InstructionOperatorNode,
  NodeKind,
  ValueLiteralKind,
} from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeAby(
  stringInput: StringInput,
  config: FinalConfig,
  instruction: InstructionOperatorNode,
): Result<AbyAddressingModeNode> {
  const suffixValue = instruction.forcedTo;
  if (suffixValue === 'b') {
    return makeError(
      'ABY addressing mode can not be forced to byte',
      instruction.range,
      stringInput.meta.originalLines,
    );
  }
  const trimmed = trimStart(stringInput);

  const valuableResult = parseValuable(trimmed, config);

  if (valuableResult.kind === ResultKind.Error) {
    return valuableResult;
  }
  const particle = /^,[yY]/.test(valuableResult.rest.value);
  if (!particle) {
    return expected(valuableResult.rest, 'the ",Y" part of ABY mode');
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
      'Hex literals must not have length 1 or 2 for ABY mode',
      [valuable.range[0] + 1, valuable.range[1]],
      stringInput.meta.originalLines,
    );
  }

  const rest = substr(valuableResult.rest, 2);

  return makeSuccess<AbyAddressingModeNode>(
    {
      kind: NodeKind.abyAddressingMode,
      value: valuableResult.value,
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}
