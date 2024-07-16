import type { MDXComponents } from 'mdx/types';
import { P } from '@/components/_atoms/P';
import { H1, H2, H3 } from '@/components/_atoms/H';

// TODO: li components need the bullet, but also, specifically to the MDX context, paragraph like styles like margin-bottom

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: H1,
    h2: H2,
    h3: H3,
    p: P,
  };
}
