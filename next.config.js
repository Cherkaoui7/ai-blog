const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: { remarkPlugins: ['remark-gfm'], rehypePlugins: [] },
});

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  turbopack: {
    root: __dirname,
  },
});
