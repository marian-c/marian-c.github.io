import {
  type LocalStorageSimpleKey,
  type LocalStorageSimple,
  localStorageSimpleGet,
  localStorageSimpleSet,
} from '@/helpers/window/localStorageSimple';
import React from 'react';

/**
 * DO NOT CHANGE KEY AFTER MOUNTING
 */
export function useLocalStorageSimpleState<T extends LocalStorageSimpleKey>(
  key: T,
): [
  LocalStorageSimple[T] | undefined,
  (
    newValueOrFunc:
      | LocalStorageSimple[T]
      | ((oldState: LocalStorageSimple[T] | undefined) => LocalStorageSimple[T]),
  ) => void,
] {
  const [value, setValue] = React.useState<LocalStorageSimple[T] | undefined>(() => {
    return localStorageSimpleGet(key) ?? undefined;
  });
  // TODO: useCallback
  const set = (
    newValueOrFunc:
      | LocalStorageSimple[T]
      | ((oldState: LocalStorageSimple[T] | undefined) => LocalStorageSimple[T]),
  ) => {
    const newValue = typeof newValueOrFunc === 'function' ? newValueOrFunc(value) : newValueOrFunc;
    localStorageSimpleSet(key, newValue);
    setValue(newValue);
  };

  return [value, set];
}
