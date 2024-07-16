import { expected, type StringInput, substr, trim } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  makeError,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import { DirectiveKind, type DirectiveNode } from '@/mcw6502compiler/parser/ast';
import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';
import { assertNever } from '@/utils';
import { parseDirectiveOrgArguments } from '@/mcw6502compiler/parser/parseDirectiveOrgArguments';
import { parseDirectiveWordArguments } from '@/mcw6502compiler/parser/parseDirectiveWordArguments';
import { directiveNameRegExp } from '@/mcw6502compiler/parser/regExp';

function validateDirectiveName(value: string): value is DirectiveKind {
  return Object.values(DirectiveKind).includes(value as any);
}

export function parseDirective(
  stringInput: StringInput,
  config: FinalConfig,
): Result<DirectiveNode> {
  const trimmed = trim(stringInput);

  const directiveName = directiveNameRegExp.exec(trimmed.value);

  if (!directiveName) {
    return expected(stringInput, "directiveName (because line starts with a '.')");
  }

  const value = directiveName[1];
  if (!value) {
    throw new ErrorShouldNotHappen();
  }
  let rest = substr(trimmed, directiveName[0]);

  if (!validateDirectiveName(value)) {
    return makeError(
      `Expected a known directive, but got ${value}`,
      [trimmed.index + 1, rest.index],
      trimmed.meta.originalLines,
    );
  }

  let directiveResult: Result<DirectiveNode>;
  switch (value) {
    case DirectiveKind.org:
      directiveResult = parseDirectiveOrgArguments(rest, config);
      break;
    case DirectiveKind.word:
      directiveResult = parseDirectiveWordArguments(rest, config);
      break;
    default:
      assertNever(value);
  }
  if (directiveResult.kind === ResultKind.Error) {
    return directiveResult;
  }

  return makeSuccess<DirectiveNode>(
    { ...directiveResult.value, range: [trimmed.index, directiveResult.rest.index] },
    directiveResult.rest,
  );
}
