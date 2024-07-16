import { makeError, makeSuccess, type Result } from '@/mcw6502compiler/parser/parserTypes';
import { type CommentNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { type StringInput, trim } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';

// TODO: value of the comment should not contain the initial `;`
export function parseComment(stringInput: StringInput, _config: FinalConfig): Result<CommentNode> {
  const trimmed = trim(stringInput);
  if (!trimmed.value.startsWith(';')) {
    return makeError(
      `Expected a comment but got: ${trimmed}`,
      [trimmed.index, trimmed.index + trimmed.value.length],
      trimmed.meta.originalLines,
    );
  }

  return makeSuccess<CommentNode>(
    {
      kind: NodeKind.comment,
      value: trimmed.value,
      range: [trimmed.index, trimmed.index + trimmed.value.length],
    },
    { value: '', index: stringInput.index + stringInput.value.length, meta: stringInput.meta },
  );
}
