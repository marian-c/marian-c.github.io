import mdx from '@next/mdx';
const withMDX = mdx()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out-dist',
  trailingSlash: true,
  images: {
    // because output is export
    unoptimized: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  productionBrowserSourceMaps: true,
};

export default withMDX(nextConfig);
