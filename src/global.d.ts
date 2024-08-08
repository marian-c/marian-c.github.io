import 'react';
import { ReactLayoutHandler } from '@/types';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

declare global {
  interface Element {
    __reactLayoutHandler?: ReactLayoutHandler | undefined;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_FEATURE_EHBASIC?: string;
    }
  }
}
