const withNextra = require('nextra').default({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  staticImage: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: '../.site',
  basePath: '/webrtc',
  assetPrefix: '/webrtc',
  images: {
    unoptimized: true,
  },
  // File-based routing (pages/en/, pages/zh/) instead of i18n
}

module.exports = withNextra(nextConfig)
