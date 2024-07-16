import { type StringInput, substr, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  makeError,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import { type ImmAddressingModeNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeImm(
  stringInput: StringInput,
  config: FinalConfig,
): Result<ImmAddressingModeNode> {
  const trimmed = trimStart(stringInput);
  if (!trimmed.value.startsWith('#')) {
    return makeError(
      'Expected immediate addressing mode',
      [trimmed.index, trimmed.index + trimmed.value.length],
      trimmed.meta.originalLines,
    );
  }

  const value = parseValuable(substr(trimmed, 1), config);
  if (value.kind === ResultKind.Error) {
    return value;
  }

  return makeSuccess<ImmAddressingModeNode>(
    {
      kind: NodeKind.immAddressingMode,
      value: value.value,
      range: [trimmed.index, value.rest.index],
    },
    value.rest,
  );
}
