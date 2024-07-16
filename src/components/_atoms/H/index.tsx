import type { FunctionComponentWithChildren } from '@/types';

export const H1: FunctionComponentWithChildren = function ({ children }) {
  return <h1 className="text-2xl mb-2 mt-2">{children}</h1>;
};

export const H2: FunctionComponentWithChildren = function ({ children }) {
  return <h2 className="text-xl mb-2 mt-2">{children}</h2>;
};

export const H3: FunctionComponentWithChildren = function ({ children }) {
  return <h3 className="text-lg mb-2 mt-2">{children}</h3>;
};
