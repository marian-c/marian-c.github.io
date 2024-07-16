import {
  expected,
  type StringInput,
  substr,
  trimStart,
} from '@/mcw6502compiler/parser/stringInput';
import { type FinalConfig } from '@/mcw6502compiler/config';
import {
  type ErrorResult,
  makeSuccess,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import {
  NodeKind,
  type ReferenceNode,
  type ValuableNode,
  ValueLiteralKind,
  type ValueLiteralNode,
} from '@/mcw6502compiler/parser/ast';
import { expectType, type TypeEqual } from 'ts-expect';
import {
  referenceRegExp,
  valueLiteralAsciiRegExp,
  valueLiteralBinRegExp,
  valueLiteralDecRegExp,
  valueLiteralHexRegExp,
} from '@/mcw6502compiler/parser/regExp';

export function parseReference(
  stringInput: StringInput,
  _config: FinalConfig,
): Result<ReferenceNode> {
  const trimmed = trimStart(stringInput);
  const foundReference = referenceRegExp.exec(trimmed.value);

  if (!foundReference || !foundReference[1]) {
    return expected(trimmed, 'a label reference');
  }
  const value = foundReference[1];
  let rest = substr(trimmed, foundReference[0]);

  return makeSuccess<ReferenceNode>(
    {
      kind: NodeKind.reference,
      referencedName: value.toLowerCase(),
      range: [trimmed.index, rest.index],
    },
    rest,
  );
}

export function getValueLiteralAscii(
  stringInput: StringInput,
  _config: FinalConfig,
): Result<{ v: string; k: ValueLiteralKind.ascii }> {
  const trimmed = trimStart(stringInput);

  // TODO: multipass parse of the literal so that the error would happen later in the string
  //  if for example the string starts with `"` but does not end in a `"` the error should be
  //  right at the end, and not at the beginning
  let value = valueLiteralAsciiRegExp.exec(trimmed.value);

  if (!value || !value[1]) {
    return expected(trimmed, 'an ascii value literal');
  }

  const rest = substr(trimmed, value[0]);

  return makeSuccess<{ v: string; k: ValueLiteralKind.ascii }>(
    { k: ValueLiteralKind.ascii, v: value[1] },
    rest,
  );
}
export function getValueLiteralBin(
  stringInput: StringInput,
  _config: FinalConfig,
): Result<{ v: string; k: ValueLiteralKind.bin }> {
  const trimmed = trimStart(stringInput);

  let value = valueLiteralBinRegExp.exec(trimmed.value);

  if (!value || !value[1]) {
    return expected(trimmed, 'a binary value literal');
  }

  const rest = substr(trimmed, value[0]);

  return makeSuccess<{ v: string; k: ValueLiteralKind.bin }>(
    { k: ValueLiteralKind.bin, v: value[1] },
    rest,
  );
}
export function getValueLiteralDec(
  stringInput: StringInput,
  _config: FinalConfig,
): Result<{ v: string; k: ValueLiteralKind.dec }> {
  const trimmed = trimStart(stringInput);

  let value = valueLiteralDecRegExp.exec(trimmed.value);

  if (!value || !value[1]) {
    return expected(trimmed, 'a decimal value literal');
  }

  const rest = substr(trimmed, value[0]);

  return makeSuccess<{ v: string; k: ValueLiteralKind.dec }>(
    { k: ValueLiteralKind.dec, v: value[1] },
    rest,
  );
}
export function getValueLiteralHex(
  stringInput: StringInput,
  _config: FinalConfig,
): Result<{ v: string; k: ValueLiteralKind.hex }> {
  const trimmed = trimStart(stringInput);

  let value = valueLiteralHexRegExp.exec(trimmed.value);

  if (!value || !value[1]) {
    return expected(trimmed, 'a hex value literal');
  }

  const rest = substr(trimmed, value[0]);

  return makeSuccess<{ v: string; k: ValueLiteralKind.hex }>(
    { k: ValueLiteralKind.hex, v: value[1] },
    rest,
  );
}

export function parseValueLiteral(
  stringInput: StringInput,
  config: FinalConfig,
): Result<ValueLiteralNode> {
  const trimmed = trimStart(stringInput);

  let innerResult: Result<{ v: string; k: ValueLiteralKind }>;
  let errors: ErrorResult[] = [];

  innerResult = getValueLiteralAscii(trimmed, config);
  if (innerResult.kind === ResultKind.Error) {
    errors.push(innerResult);
    innerResult = getValueLiteralBin(trimmed, config);
  }
  if (innerResult.kind === ResultKind.Error) {
    errors.push(innerResult);
    innerResult = getValueLiteralDec(trimmed, config);
  }
  if (innerResult.kind === ResultKind.Error) {
    errors.push(innerResult);
    innerResult = getValueLiteralHex(trimmed, config);
  }

  if (innerResult.kind === ResultKind.Error) {
    errors.push(innerResult);
    const error = errors.reduce((prev, curr) => {
      return prev.range[0] > curr.range[0] ? prev : curr;
    });
    if (error.range[0] === trimmed.index) {
      return expected(trimmed, 'a valuable');
    }
    return error;
  }

  // make sure we tried everything
  type Kind = ValueLiteralNode['valueLiteralKind'];
  expectType<TypeEqual<Kind, typeof innerResult.value.k>>(true);
  expectType<TypeEqual<typeof innerResult.value.k, Kind>>(true);

  return makeSuccess<ValueLiteralNode>(
    {
      kind: NodeKind.valueLiteral,
      valueLiteralKind: innerResult.value.k,
      originalStringValue: innerResult.value.v,
      range: [stringInput.index, innerResult.rest.index],
    },
    innerResult.rest,
  );
}

export function parseValuable(stringInput: StringInput, config: FinalConfig): Result<ValuableNode> {
  const trimmed = trimStart(stringInput);

  let innerResult;
  let errors: ErrorResult[] = [];

  innerResult = parseReference(trimmed, config);
  if (innerResult.kind === ResultKind.Error) {
    errors.push(innerResult);
    innerResult = parseValueLiteral(trimmed, config);
  }

  if (innerResult.kind === ResultKind.Error) {
    errors.push(innerResult);
    return errors.reduce((prev, curr) => {
      return prev.range[0] > curr.range[0] ? prev : curr;
    });
  }

  // make sure we tried everything
  type Kind = ValuableNode['kind'];
  expectType<TypeEqual<Kind, typeof innerResult.value.kind>>(true);
  expectType<TypeEqual<typeof innerResult.value.kind, Kind>>(true);

  return makeSuccess<ValuableNode>(innerResult.value, innerResult.rest);
}
