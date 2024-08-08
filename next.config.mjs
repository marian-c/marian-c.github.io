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
  webpack: (config) => {

    // for some reason, asset/inline does not work, but should
    // TODO: test this with a newer version of next
    // config.module.rules.unshift({
    //   test: /\.bin/,
    //   type: 'asset/inline',
    //   generator: {
    //     dataUrl() {
    //       return 'asd';
    //     }
    //   },
    // });

    // allow getting paths for bin files
    // TODO: restrict this loader to public folder
    config.module.rules.unshift({
      test: /\.bin/,
      type: 'asset/resource',
      generator: {
        // `static` tricks next to serve this file
        filename: 'static/[file]'
      },
    })
    return config;
  }
};

export default withMDX(nextConfig);
