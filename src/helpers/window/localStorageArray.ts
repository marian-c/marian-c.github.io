import { v4 as uuidv4 } from 'uuid';

import { isBrowser } from '@/utils';

export type LocalStorageArray = {
  'hex-converter': number;
  'experiment-multiple': number;
};

export type LocalStorageArrayKey = keyof LocalStorageArray;

export function localStorageArrayGet<T extends LocalStorageArrayKey>(key: T) {
  if (!isBrowser) {
    return null;
  }
  let v = localStorage.getItem('_array__' + key);
  if (v !== null) {
    v = JSON.parse(v);
  }
  return v as [id: string, value: LocalStorageArray[T]][] | null;
}

export function localStorageArrayPush<T extends LocalStorageArrayKey>(
  key: T,
  value: LocalStorageArray[T],
) {
  let existingValue = localStorageArrayGet(key);
  if (existingValue === null) {
    existingValue = [];
  }

  const newEntry: [id: string, value: LocalStorageArray[T]] = [uuidv4(), value];
  existingValue.push(newEntry);

  localStorage.setItem('_array__' + key, JSON.stringify(existingValue));

  return newEntry;
}

export function localStorageArrayRemove<T extends LocalStorageArrayKey>(key: T, id: string) {
  let existingValue = localStorageArrayGet(key);
  if (existingValue === null) {
    existingValue = [];
  }

  const newValue = existingValue.filter((v) => v[0] !== id);

  localStorage.setItem('_array__' + key, JSON.stringify(newValue));

  return newValue;
}

export function localStorageArraySet<T extends LocalStorageArrayKey>(
  key: T,
  id: string,
  value: LocalStorageArray[T],
) {
  let existingValue = localStorageArrayGet(key);
  if (existingValue === null) {
    existingValue = [];
  }

  const newValue = existingValue.map((v) => {
    if (v[0] === id) {
      return [v[0], value];
    }
    return v;
  });

  localStorage.setItem('_array__' + key, JSON.stringify(newValue));

  return newValue;
}
