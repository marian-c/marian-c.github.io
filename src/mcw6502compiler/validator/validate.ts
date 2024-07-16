import {
  type ErrorResult,
  makeError,
  type ParseResult,
} from '@/mcw6502compiler/parser/parserTypes';
import { NodeKind } from '@/mcw6502compiler/parser/ast';
import type { Config } from '@/mcw6502compiler/config';

/**
 * if the returned value has length 0, there are no errors
 */
export function validateParseTree(parseTree: ParseResult, _initialConfig: Config): ErrorResult[] {
  const errors: ErrorResult[] = [];
  const identifiers = new Set<string>();

  // check for duplicate identifiers
  for (const line of parseTree.program.lines) {
    let identifier = null;
    if (line.contents?.kind === NodeKind.labelDefinition) {
      identifier = line.contents.value;
    }

    if (line.contents?.kind === NodeKind.symbolDefinition) {
      identifier = line.contents.symbolName;
    }

    // TODO: better error location
    if (identifier !== null) {
      if (identifiers.has(identifier)) {
        errors.push(
          makeError(`Duplicate identifier: ${identifier}`, line.range, parseTree.originalLines),
        );
      }
      identifiers.add(identifier);
    }
  }

  // TODO: validate missing references

  return errors;
}
