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
  type InstructionOperatorNode,
  NodeKind,
  ValueLiteralKind,
  type ZpxAddressingModeNode,
} from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeZpx(
  stringInput: StringInput,
  config: FinalConfig,
  instruction: InstructionOperatorNode,
): Result<ZpxAddressingModeNode> {
  const suffixValue = instruction.forcedTo;

  const trimmed = trimStart(stringInput);

  const valuableResult = parseValuable(trimmed, config);

  if (valuableResult.kind === ResultKind.Error) {
    return valuableResult;
  }
  const particle = /^,[xX]/.test(valuableResult.rest.value);
  if (!particle) {
    return expected(valuableResult.rest, 'the ",X" part of ZPX mode');
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
      'B suffix required for ZPX mode',
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

  const rest = substr(valuableResult.rest, 2);

  return makeSuccess<ZpxAddressingModeNode>(
    {
      kind: NodeKind.zpxAddressingMode,
      value: valuableResult.value,
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}
