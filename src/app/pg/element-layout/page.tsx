'use client';

import React from 'react';
import { useElementLayout } from '@/hooks/useElementLayout/useElementLayout';

export default function PagePgElementLayout() {
  const elRef = React.useRef<HTMLDivElement>(null);
  useElementLayout(elRef, (e) => {
    console.debug('onLayout', e);
  });
  return <div ref={elRef}>content</div>;
}
