import {
  expected,
  type StringInput,
  substr,
  trimStart,
} from '@/mcw6502compiler/parser/stringInput';
import type { FinalConfig } from '@/mcw6502compiler/config';
import { makeError, makeSuccess, type Result } from '@/mcw6502compiler/parser/parserTypes';
import { type InstructionOperatorNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { instructionOperatorRegExp } from '@/mcw6502compiler/parser/regExp';
import { expectType, type TypeEqual } from 'ts-expect';

export function parseInstructionOperator(
  stringInput: StringInput,
  config: FinalConfig,
): Result<InstructionOperatorNode> {
  const trimmed = trimStart(stringInput);
  const firstThreeLetters = instructionOperatorRegExp.exec(trimmed.value);

  if (!firstThreeLetters) {
    return expected(stringInput, 'an instruction');
  }

  const firstThreeLettersLower = firstThreeLetters[0].toLowerCase();

  if (!config.instructionsInfo[firstThreeLettersLower]) {
    return makeError(
      `Instruction not recognised: ${firstThreeLettersLower}`,
      [trimmed.index, trimmed.index + firstThreeLettersLower.length],
      trimmed.meta.originalLines,
    );
  }

  let rest = substr(trimmed, firstThreeLettersLower);

  let forcedTo;
  if (rest.value.startsWith('.b') || rest.value.startsWith('.B')) {
    forcedTo = 'b' as const;
  }

  rest = substr(rest, forcedTo ? `.${forcedTo}` : '');

  expectType<TypeEqual<typeof forcedTo, InstructionOperatorNode['forcedTo']>>(true);
  expectType<TypeEqual<InstructionOperatorNode['forcedTo'], typeof forcedTo>>(true);

  return makeSuccess<InstructionOperatorNode>(
    {
      kind: NodeKind.instructionOperator,
      value: firstThreeLettersLower,
      range: [trimmed.index, rest.index],
      ...(forcedTo !== undefined ? { forcedTo } : {}),
    },
    rest,
  );
}
