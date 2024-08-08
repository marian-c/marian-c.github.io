'use client'; // needs to the top level calls to work on the client

import React from 'react';
import { localStorageCleanup } from '@/helpers/window/localStorageCleanup';
// emit static files
import * as _ from '@/staticFiles';

localStorageCleanup();

export default function Template({ children }: { children: React.ReactNode }) {
  return children;
}
