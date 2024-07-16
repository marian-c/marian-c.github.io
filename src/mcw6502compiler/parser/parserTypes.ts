import { type ProgramNode } from '@/mcw6502compiler/parser/ast';
import { type StringInput } from '@/mcw6502compiler/parser/stringInput';

export enum ResultKind {
  Success,
  Error,
}

export interface SuccessResult<T> {
  kind: ResultKind.Success;
  value: T;
  rest: StringInput;
}

export interface ErrorResult {
  kind: ResultKind.Error;
  message: string;
  range: [indexInStringStart: number, indexInStringEnd: number];
  lineRange: { start: [lineNo: number, charNo: number]; end: [lineNo: number, charNo: number] };
}

export type Result<T> = SuccessResult<T> | ErrorResult;

export type ParseResult = { errors: ErrorResult[]; program: ProgramNode; originalLines: string[] };

export function makeError(
  message: string,
  range: [number, number],
  originalLines: string[],
): ErrorResult {
  const lineRange = {
    start: [0, 0] as [number, number],
    end: [0, 0] as [number, number],
  };
  originalLines.reduce((start, line, lineIdx) => {
    // XXX: this assumes that the end line slot is on the "prev line"
    const nextStart = start + line.length + 1;
    if (range[0] >= start && range[0] < nextStart) {
      lineRange.start[0] = lineIdx + 1;
      lineRange.start[1] = range[0] - start + 1;
    }

    if (range[1] >= start && range[1] < nextStart) {
      lineRange.end[0] = lineIdx + 1;
      lineRange.end[1] = range[1] - start + 1;
    }

    return nextStart;
  }, 0);
  return {
    lineRange,
    kind: ResultKind.Error,
    message,
    range,
  };
}

export function makeSuccess<T>(value: T, rest: StringInput): SuccessResult<T> {
  return {
    kind: ResultKind.Success,
    value,
    rest,
  };
}
