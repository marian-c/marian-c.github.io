import { type ErrorResult, makeError } from './parserTypes';

export type StringInputMeta = {
  originalLines: string[];
};

export interface StringInput {
  meta: StringInputMeta;
  value: string;
  index: number;
}

export function trimStart(stringInput: StringInput): StringInput {
  const oldStr = stringInput.value;
  const newStr = stringInput.value.trimStart();
  if (newStr === oldStr) {
    return stringInput;
  }
  return {
    value: newStr,
    index: stringInput.index + (oldStr.length - newStr.length),
    meta: stringInput.meta,
  };
}

export function trim(stringInput: StringInput): StringInput {
  const oldStr = stringInput.value;
  const newStr = stringInput.value.trim();
  if (newStr === oldStr) {
    return stringInput;
  }
  return {
    value: newStr,
    index: stringInput.index + oldStr.indexOf(newStr),
    meta: stringInput.meta,
  };
}

export function substr(stringInput: StringInput, amount: number | string): StringInput {
  const a = typeof amount === 'number' ? amount : amount.length;

  const oldStr = stringInput.value;
  const newStr = stringInput.value.substring(a);
  if (newStr === oldStr) {
    return stringInput;
  }
  return {
    value: newStr,
    index: stringInput.index + a,
    meta: stringInput.meta,
  };
}

export function testRegExp(stringInput: StringInput, regExp: RegExp) {
  return regExp.test(stringInput.value);
}

export function expected(stringInput: StringInput, label: string): ErrorResult {
  if (/^\s*$/.test(stringInput.value)) {
    return makeError(
      `Unexpected end of input, expected ${label}`,
      [stringInput.index, stringInput.index + stringInput.value.length],
      stringInput.meta.originalLines,
    );
  }
  const trimmed = trimStart(stringInput);
  const firstWord = trimmed.value.split(/\s/)[0];
  return makeError(
    `Unexpected identifier: ${firstWord ?? '[missing]'}, expected ${label}`,
    [trimmed.index, trimmed.index + (firstWord?.length || 0)],
    trimmed.meta.originalLines,
  );
}
