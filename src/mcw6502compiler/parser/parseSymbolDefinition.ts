import { expected, type StringInput, substr, trim } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import { makeSuccess, type Result, ResultKind } from '@/mcw6502compiler/parser/parserTypes';
import { NodeKind, type SymbolDefinitionNode } from '@/mcw6502compiler/parser/ast';
import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';
import { symbolDefinitionNameRegExp } from '@/mcw6502compiler/parser/regExp';
import { parseSymbolDefinitionValue } from '@/mcw6502compiler/parser/parseSymbolDefinitionValue';

export function parseSymbolDefinition(
  stringInput: StringInput,
  config: FinalConfig,
): Result<SymbolDefinitionNode> {
  const trimmed = trim(stringInput);

  const symbolName = symbolDefinitionNameRegExp.exec(trimmed.value);

  if (!symbolName) {
    return expected(stringInput, 'a symbol name');
  }

  const value = symbolName[1];
  if (!value) {
    throw new ErrorShouldNotHappen();
  }
  let rest = substr(trimmed, symbolName[0]);

  const symbolValueResult = parseSymbolDefinitionValue(rest, config);

  if (symbolValueResult.kind === ResultKind.Error) {
    return symbolValueResult;
  }

  const symbolValue = symbolValueResult.value;
  rest = symbolValueResult.rest;

  return makeSuccess<SymbolDefinitionNode>(
    {
      kind: NodeKind.symbolDefinition,
      range: [trimmed.index, rest.index],
      symbolName: value.toLowerCase(),
      symbolValue: symbolValue,
    },
    rest,
  );
}
