import type { FunctionComponentWithChildren } from '@/types';

const Container: FunctionComponentWithChildren = function ({ children }) {
  return <div className="bg-color-stack aspect-square max-h-[100vh] m-auto">{children}</div>;
};

export default function PageCreativeCodingSample() {
  return <Container>test</Container>;
}
