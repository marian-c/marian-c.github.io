// inspired by https://github.com/streamich/react-use/blob/master/src/useTimeoutFn.ts
import { useCallback, useEffect, useRef } from 'react';

/**
 * DO NOT CHANGE fn
 */
export default function useTimeoutFn(fn: Function, ms: number = 0) {
  const ready = useRef<boolean | null>(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const callback = useRef(fn);

  const set = useCallback(() => {
    ready.current = false;
    timeout.current && clearTimeout(timeout.current);

    timeout.current = setTimeout(() => {
      ready.current = true;
      callback.current();
    }, ms);
  }, [ms]);

  const clear = useCallback(() => {
    ready.current = null;
    timeout.current && clearTimeout(timeout.current);
  }, []);

  useEffect(() => {
    return clear;
  }, [ms, clear]);

  return set;
}
