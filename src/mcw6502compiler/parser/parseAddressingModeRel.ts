import { type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import { makeSuccess, type Result, ResultKind } from '@/mcw6502compiler/parser/parserTypes';
import { NodeKind, type RelAddressingModeNode } from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseAddressingModeRel(
  stringInput: StringInput,
  config: FinalConfig,
): Result<RelAddressingModeNode> {
  const trimmed = trimStart(stringInput);

  let value = parseValuable(trimmed, config);
  if (value.kind === ResultKind.Error) {
    return value;
  }

  return makeSuccess<RelAddressingModeNode>(
    {
      kind: NodeKind.relAddressingMode,
      value: value.value,
      range: [trimmed.index, value.rest.index],
    },
    value.rest,
  );
}
