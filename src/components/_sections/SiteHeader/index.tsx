'use client';

import type { FunctionComponent } from '@/types';
import { Anchor } from '@/components/_atoms/Anchor';
import React from 'react';
import { usePathname } from 'next/navigation';

export const SiteHeader: FunctionComponent = function () {
  const pathName = usePathname();
  return (
    <header>
      {pathName === '/' ? (
        <span className="text-xl">Marian-C</span>
      ) : (
        <Anchor href="/">
          <span className="text-xl">Marian-C</span>
        </Anchor>
      )}
    </header>
  );
};
