import { parseSource } from '@/mcw6502compiler/parser/parse';
import { type Config, makeConfig } from '@/mcw6502compiler/config';
import { validateParseTree } from '@/mcw6502compiler/validator/validate';
import { assemble } from '@/mcw6502compiler/assembler/assemble';
import type { ErrorResult } from '@/mcw6502compiler/parser/parserTypes';
import type { ExtractSuccessType, GenericResult } from '@/types';
import { GenericResultKind } from '@/types';

export function compile(
  originalSource: string,
  initialConfig: Config,
): GenericResult<ErrorResult, ExtractSuccessType<ReturnType<typeof assemble>>> {
  const config = makeConfig(initialConfig);
  let errors: ErrorResult[] = [];

  const parseResult = parseSource(originalSource, config);
  errors.push(...parseResult.errors);

  if (!errors.length) {
    errors.push(...validateParseTree(parseResult, config));
  }

  if (!errors.length) {
    return assemble(parseResult, config);
  }

  return { kind: GenericResultKind.error, errors };
}
