export function assertNever(value: never, noThrow?: boolean): never {
  if (noThrow) {
    return value;
  }

  throw new Error(`Unexpected: ${JSON.stringify(value)}`);
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
