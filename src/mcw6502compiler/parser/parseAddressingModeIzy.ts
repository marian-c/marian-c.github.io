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
import { type IzyAddressingModeNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeIzy(
  stringInput: StringInput,
  config: FinalConfig,
): Result<IzyAddressingModeNode> {
  const trimmed = trimStart(stringInput);

  if (!trimmed.value.startsWith('(')) {
    return expected(trimmed, 'x-indexed indirect mode');
  }

  const value = parseValuable(substr(trimmed, 1), config);

  if (value.kind === ResultKind.Error) {
    return value;
  }

  if (value.rest.value.startsWith(' ') || value.rest.value.startsWith('\t')) {
    return makeError(
      'Unexpected empty space, expected the "),Y" part of IZY mode',
      [value.rest.index, value.rest.index + 1],
      stringInput.meta.originalLines,
    );
  }

  if (!value.rest.value.startsWith('),y') && !value.rest.value.startsWith('),Y')) {
    return expected(value.rest, 'the "),Y" part of izy mode');
  }

  const rest = substr(value.rest, 3);

  return makeSuccess<IzyAddressingModeNode>(
    {
      kind: NodeKind.izyAddressingMode,
      value: value.value,
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}
