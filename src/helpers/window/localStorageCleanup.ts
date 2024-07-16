import type { LocalStorageSimpleKey } from '@/helpers/window/localStorageSimple';
import type { LocalStorageArrayKey } from '@/helpers/window/localStorageArray';
import { isBrowser } from '@/utils';

const knownSimpleKeys: Record<LocalStorageSimpleKey, 1> = {
  'load-from-local-storage-exp': 1,
  'simple-6502-editor-code': 1,
  simple_6502_emulator_computer_configuration: 1,
};

const knownArrayKeys: Record<LocalStorageArrayKey, 1> = {
  'hex-converter': 1,
  'experiment-multiple': 1,
};

export function localStorageCleanup() {
  if (!isBrowser) {
    return;
  }
  const simpleKeys = Object.keys(knownSimpleKeys).map((k) => '_simple__' + k);
  const arrayKeys = Object.keys(knownArrayKeys).map((k) => '_array__' + k);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // ally-supports-cache is some internal nextjs stuff - might be gone in the future, more might come, strange
    if (
      key !== null &&
      !simpleKeys.includes(key) &&
      !arrayKeys.includes(key) &&
      key !== 'ally-supports-cache'
    ) {
      localStorage.removeItem(key);
    }
  }
}
