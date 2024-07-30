import { isBrowser } from '@/utils';
import type { ComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/types';

export type LocalStorageSimple = {
  'load-from-local-storage-exp': number;
  'simple-6502-editor-code': string;
  simple_6502_emulator_computer_configuration: ComputerConfiguration;
  hide_emulator_greeting: boolean;
  editor_scroll: number;
  bus_monitor_scroll: number;
};

export type LocalStorageSimpleKey = keyof LocalStorageSimple;

// TODO: this is used for scroll events, in such cases it might be faster to keep the change in memory and only flush
//   to localstorage occasionally
export function localStorageSimpleSet<T extends LocalStorageSimpleKey>(
  key: T,
  value: LocalStorageSimple[T],
) {
  if (!isBrowser) {
    return;
  }
  localStorage.setItem('_simple__' + key, JSON.stringify(value));
}

export function localStorageSimpleGet<T extends LocalStorageSimpleKey>(
  key: T,
  defaultValue: LocalStorageSimple[T],
): LocalStorageSimple[T];
export function localStorageSimpleGet<T extends LocalStorageSimpleKey>(
  key: T,
): LocalStorageSimple[T] | null;
export function localStorageSimpleGet<T extends LocalStorageSimpleKey>(
  key: T,
  defaultValue: LocalStorageSimple[T] | null = null,
) {
  if (!isBrowser) {
    return defaultValue;
  }
  let v = localStorage.getItem('_simple__' + key);
  if (v !== null) {
    v = JSON.parse(v);
  }
  return v as LocalStorageSimple[T];
}
