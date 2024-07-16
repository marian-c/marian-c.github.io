import {
  type LocalStorageArrayKey,
  type LocalStorageArray,
  localStorageArrayGet,
  localStorageArrayPush,
  localStorageArrayRemove,
  localStorageArraySet,
} from '@/helpers/window/localStorageArray';
import React from 'react';

export function useLocalStorageArrayState<T extends LocalStorageArrayKey>(
  key: T,
  defaultIfNone: LocalStorageArray[T],
): {
  data: Array<[id: string, LocalStorageArray[T]]>;
  push: (newEntry: LocalStorageArray[T]) => void;
  remove: (id: string) => void;
  set: (id: string, newEntry: LocalStorageArray[T]) => void;
} {
  const [arr, setArr] = React.useState(() => {
    let localStorageValue = localStorageArrayGet(key);
    if (localStorageValue === null) {
      localStorageArrayPush(key, defaultIfNone);
      return localStorageArrayGet(key)!;
    }
    return localStorageValue;
  });

  // TODO: useCallback
  const push = (newEntry: LocalStorageArray[T]) => {
    localStorageArrayPush(key, newEntry);
    setArr(localStorageArrayGet(key)!);
  };

  const remove = (id: string) => {
    localStorageArrayRemove(key, id);
    setArr(localStorageArrayGet(key)!);
  };

  const set = (id: string, newValue: LocalStorageArray[T]) => {
    localStorageArraySet(key, id, newValue);
    setArr(localStorageArrayGet(key)!);
  };

  return { data: arr, push, remove, set };
}
