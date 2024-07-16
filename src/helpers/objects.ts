import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';

export function sureAccess<T>(obj: Record<string, T>, str: string): T {
  const v = obj[str];
  if (v === undefined) {
    throw new ErrorShouldNotHappen();
  }

  return v;
}
