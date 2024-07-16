// types from: https://www.totaltypescript.com/tips/use-function-overloads-and-generics-to-type-a-compose-function
export function pipe<Input, FirstArg, SecondArg, ThirdArg, FourthArg>(
  func: (input: Input) => FirstArg,
  func2: (input: FirstArg) => SecondArg,
  func3: (input: SecondArg) => ThirdArg,
): (input: Input) => ThirdArg;

export function pipe<Input, FirstArg, SecondArg, ThirdArg, FourthArg>(
  func: (input: Input) => FirstArg,
  func2: (input: FirstArg) => SecondArg,
  func3: (input: SecondArg) => ThirdArg,
  func4: (input: ThirdArg) => FourthArg,
): (input: Input) => FourthArg;

export function pipe<Input, FirstArg, SecondArg, ThirdArg, FourthArg, FifthArg>(
  func: (input: Input) => FirstArg,
  func2: (input: FirstArg) => SecondArg,
  func3: (input: SecondArg) => ThirdArg,
  func4: (input: ThirdArg) => FourthArg,
  func5: (input: FourthArg) => FifthArg,
): (input: Input) => FifthArg;

// implementation from: https://dev.to/ascorbic/creating-a-typed-compose-function-in-typescript-3-351i
export function pipe(fn1: any, ...fns: any[]) {
  const piped = fns.reduce(
    (prevFn, nextFn) => (value: any) => nextFn(prevFn(value)),
    (value: any) => value,
  );
  return (...args: any[]) => piped(fn1(...args));
}

export const split = (separator: string | RegExp, limit?: number) => (s: string) =>
  s.split(separator, limit);

export const substring = (start: number, end?: number) => (s: string) => s.substring(start, end);

export const map =
  <T, U>(fn: (value: T) => U) =>
  (arr: T[]) =>
    arr.map(fn);

export const defaults =
  <T, U>(defaultValue: T) =>
  (value: U) =>
    value ?? (defaultValue as T & U);

type A<B> = B extends [any, infer U][] ? U : B extends Array<Array<infer U>> ? U : never;

// TODO: get inspiration from the Array find method for the types
export const findEntryByKey =
  <T>(needle: T) =>
  <Arr extends any[][]>(arr: Arr) =>
    arr.find((e) => e[0] === needle)?.[1] as A<Arr> | undefined;
