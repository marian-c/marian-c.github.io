import type { FunctionComponentWithChildren } from '@/types';

export const P: FunctionComponentWithChildren = function ({ children }) {
  return <p className="mb-2 mt-2">{children}</p>;
};
