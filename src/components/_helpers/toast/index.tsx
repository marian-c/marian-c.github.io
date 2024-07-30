'use client';
// TODO: animate mount unmount
// TODO: reset or pause hide timer when mouse over

import React from 'react';
import type { FunctionComponent } from '@/types';
import { LayoutSpread } from '@/components/_layouts/LayoutSpread';
import { anchorCn } from '@/components/_atoms/Anchor';
import { clsx } from '@/helpers/clsx';

export type Toast = {
  contents: React.ReactNode;
  dontAutoHide?: boolean;
  showClose?: boolean;
  autohideTimeout?: number;
};

type FullToast = Toast & { id: number };

const autohideDefaultTimeout = 10000;

let nextId = 0;

let $data: FullToast[] = [];

// TODO: is a Set better?
let listeners: Array<() => void> = [];

function subscribe(fn: () => void): () => void {
  listeners = [...listeners, fn];
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
function onStoreChange$(): FullToast[] {
  return $data;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function addToast(toast: Toast) {
  const id = nextId++;
  $data = [...$data, { ...toast, id }];
  emitChange();
  if (!toast.dontAutoHide) {
    setTimeout(removeToast, toast.autohideTimeout || autohideDefaultTimeout, id);
  }
  return () => {
    removeToast(id);
  };
}

function removeToast(id: number) {
  $data = $data.filter((d) => d.id !== id);
  emitChange();
}

const ToastComponent: FunctionComponent<{ toast: FullToast }> = function ({ toast }) {
  return (
    <LayoutSpread useChild inline>
      <div className="bg-black text-white my-0.5 min-w-[400px] max-w-[30vw]">
        <div className="p-2">{toast.contents}</div>
        {toast.showClose && (
          <span
            onClick={() => {
              removeToast(toast.id);
            }}
            className={clsx(anchorCn, 'p-2 text-button-background-hover')}
          >
            close
          </span>
        )}
      </div>
    </LayoutSpread>
  );
};

export function ToastDestination() {
  const $toasts = React.useSyncExternalStore<FullToast[]>(
    subscribe,
    onStoreChange$,
    onStoreChange$,
  );
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if ($toasts.length) {
      wrapperRef.current?.scrollTo(0, wrapperRef.current?.scrollHeight);
    }
  }, [$toasts]);
  return (
    <div
      className="z-40 fixed bottom-1 right-1 flex flex-col items-end overflow-auto max-h-[90vh] px-1 py-0.5 bg-gray-300/40 backdrop-blur opacity-90 border border-white"
      ref={wrapperRef}
    >
      {$toasts.map((toast) => {
        return <ToastComponent key={toast.id} toast={toast} />;
      })}
    </div>
  );
}
