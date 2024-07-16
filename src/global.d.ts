import 'react';
import { LayoutEvent, ReactLayoutHandler } from '@/types';

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

// declare global {
//   namespace NodeJS {
//     interface ProcessEnv {
//       GITHUB_AUTH_TOKEN: string;
//       NODE_ENV: 'development' | 'production';
//       PORT?: string;
//       PWD: string;
//     }
//   }
// }
