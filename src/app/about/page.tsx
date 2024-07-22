import React from 'react';
import AboutMdx from './about.mdx';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marian-C - About this website',
  description: 'How this website operates',
};

export default function About() {
  return (
    <>
      <AboutMdx />
    </>
  );
}
