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
import { type IzxAddressingModeNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeIzx(
  stringInput: StringInput,
  config: FinalConfig,
): Result<IzxAddressingModeNode> {
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
      'Unexpected empty space, expected the ",X)" part of IZX mode',
      [value.rest.index, value.rest.index + 1],
      stringInput.meta.originalLines,
    );
  }

  if (!value.rest.value.startsWith(',x)') && !value.rest.value.startsWith(',X)')) {
    return expected(value.rest, 'the ",X)" part of IZX mode');
  }

  const rest = substr(value.rest, 3);

  return makeSuccess<IzxAddressingModeNode>(
    {
      kind: NodeKind.izxAddressingMode,
      value: value.value,
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}
