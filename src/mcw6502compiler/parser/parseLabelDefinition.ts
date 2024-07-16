import { expected, type StringInput, substr, trim } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import { makeSuccess, type Result } from '@/mcw6502compiler/parser/parserTypes';
import { type LabelDefinitionNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';

// TODO: the label definition node, the range includes the comment if the line has a comment
// this is not the case of the rest of the instructions

export const labelDefinitionRegExp = /^([a-zA-Z]+[a-zA-Z0-9_]*):/;
export function parseLabelDefinition(
  stringInput: StringInput,
  _config: FinalConfig,
): Result<LabelDefinitionNode> {
  const trimmed = trim(stringInput);

  const labelDefinition = labelDefinitionRegExp.exec(trimmed.value);

  if (!labelDefinition) {
    return expected(stringInput, 'a label definition');
  }
  const value = labelDefinition[1];
  if (!value) {
    throw new ErrorShouldNotHappen();
  }
  let rest = substr(trimmed, labelDefinition[0]);

  // TODO: allow for instruction after label definition, on the same line

  return makeSuccess<LabelDefinitionNode>(
    {
      kind: NodeKind.labelDefinition,
      value: value.toLowerCase(),
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}
