import { type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import { makeSuccess, type Result, ResultKind } from '@/mcw6502compiler/parser/parserTypes';
import { DirectiveKind, type DirectiveOrgNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseValueLiteral } from '@/mcw6502compiler/parser/parseValuable';

export function parseDirectiveOrgArguments(
  stringInput: StringInput,
  config: FinalConfig,
): Result<DirectiveOrgNode> {
  const trimmed = trimStart(stringInput);

  // TODO: value literals for .org should be limited to 2 bytes, practically
  const value = parseValueLiteral(trimmed, config);
  if (value.kind === ResultKind.Error) {
    return value;
  }

  return makeSuccess<DirectiveOrgNode>(
    {
      kind: NodeKind.directive,
      directiveKind: DirectiveKind.org,
      address: value.value,
      range: [trimmed.index, value.rest.index],
    },
    value.rest,
  );
}
