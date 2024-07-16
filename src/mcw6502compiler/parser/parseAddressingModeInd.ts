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
import { type IndAddressingModeNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeInd(
  stringInput: StringInput,
  config: FinalConfig,
): Result<IndAddressingModeNode> {
  const trimmed = trimStart(stringInput);

  if (!trimmed.value.startsWith('(')) {
    return expected(trimmed, 'Indirect addressing mode');
  }

  const value = parseValuable(substr(trimmed, 1), config);

  if (value.kind === ResultKind.Error) {
    return value;
  }

  if (value.rest.value.startsWith(' ') || value.rest.value.startsWith('\t')) {
    return makeError(
      'Unexpected empty space, expected the ")" part of IND mode',
      [value.rest.index, value.rest.index + 1],
      stringInput.meta.originalLines,
    );
  }
  if (!value.rest.value.startsWith(')')) {
    return expected(value.rest, 'the ")" part of IND mode');
  }

  const rest = substr(value.rest, 1);

  return makeSuccess<IndAddressingModeNode>(
    {
      kind: NodeKind.indAddressingMode,
      value: value.value,
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}
