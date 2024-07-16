import { isBrowser } from '@/utils';
import type { ComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/types';

export type LocalStorageSimple = {
  'load-from-local-storage-exp': number;
  'simple-6502-editor-code': string;
  simple_6502_emulator_computer_configuration: ComputerConfiguration;
};

export type LocalStorageSimpleKey = keyof LocalStorageSimple;

export function localStorageSimpleSet<T extends LocalStorageSimpleKey>(
  key: T,
  value: LocalStorageSimple[T],
) {
  if (!isBrowser) {
    return;
  }
  localStorage.setItem('_simple__' + key, JSON.stringify(value));
}

export function localStorageSimpleGet<T extends LocalStorageSimpleKey>(key: T) {
  if (!isBrowser) {
    return null;
  }
  let v = localStorage.getItem('_simple__' + key);
  if (v !== null) {
    v = JSON.parse(v);
  }
  return v as LocalStorageSimple[T] | null;
}
