import { type StringInput, trimStart } from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import { type Result } from '@/mcw6502compiler/parser/parserTypes';
import { type SymbolDefinitionValueNode } from '@/mcw6502compiler/parser/ast';
import { parseValueLiteral } from '@/mcw6502compiler/parser/parseValuable';

export function parseSymbolDefinitionValue(
  stringInput: StringInput,
  config: FinalConfig,
): Result<SymbolDefinitionValueNode> {
  const trimmed = trimStart(stringInput);

  return parseValueLiteral(trimmed, config);
}
