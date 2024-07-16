import { type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import { makeSuccess, type Result, ResultKind } from '@/mcw6502compiler/parser/parserTypes';
import { DirectiveKind, type DirectiveWordNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseValuable } from '@/mcw6502compiler/parser/parseValuable';

export function parseDirectiveWordArguments(
  stringInput: StringInput,
  config: FinalConfig,
): Result<DirectiveWordNode> {
  const trimmed = trimStart(stringInput);

  const value = parseValuable(trimmed, config);
  if (value.kind === ResultKind.Error) {
    return value;
  }

  return makeSuccess<DirectiveWordNode>(
    {
      kind: NodeKind.directive,
      directiveKind: DirectiveKind.word,
      value: value.value,
      range: [trimmed.index, value.rest.index],
    },
    value.rest,
  );
}
