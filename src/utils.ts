import { type GenericResult, type GenericResultSuccess, GenericResultKind } from '@/types';

export function assertNever(value: never, noThrow?: boolean): never {
  if (noThrow) {
    return value;
  }

  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

export function assertIsDefined<T>(
  val: T,
  msg: string | null = null,
): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    const message = msg ?? `Expected 'val' to be defined, but received ${val}`;
    console.error(message);
    throw new Error(message);
  }
}

export function assertIsGenericResultSuccess<T>(
  val: GenericResult<any, T>,
): asserts val is GenericResultSuccess<T> {
  if (val.kind === GenericResultKind.error) {
    console.error(JSON.stringify(val, null, 2));
    const message = 'Generic Result value is not success';
    console.error(message);
    throw new Error(message);
  }
}

export const isBrowser = typeof window !== 'undefined';

export const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export const noop = () => {};

export const noopThrow = () => {
  throw new Error('Should not be called');
};
