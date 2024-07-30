import {
  type LocalStorageSimpleKey,
  type LocalStorageSimple,
  localStorageSimpleGet,
  localStorageSimpleSet,
} from '@/helpers/window/localStorageSimple';
import React from 'react';
import { isBrowser } from '@/utils';

/**
 * DO NOT CHANGE KEY AFTER MOUNTING
 */
export function useLocalStorageSimpleState<T extends LocalStorageSimpleKey>(
  key: T,
  defaultValueClient: LocalStorageSimple[T],
  defaultValueServer: LocalStorageSimple[T],
): [
  value: LocalStorageSimple[T],
  setter: React.Dispatch<React.SetStateAction<LocalStorageSimple[T]>>,
] {
  const [value, setValue] = React.useState<LocalStorageSimple[T]>(() => {
    return localStorageSimpleGet(key, isBrowser ? defaultValueClient : defaultValueServer);
  });
  // const [hasRendered, setHasRendered]
  // TODO: useCallback
  const set: React.Dispatch<React.SetStateAction<LocalStorageSimple[T]>> = (newValueOrGetter) => {
    const newValue =
      typeof newValueOrGetter === 'function' ? newValueOrGetter(value) : newValueOrGetter;
    localStorageSimpleSet(key, newValue);
    setValue(newValue);
  };

  return [value, set];
}
