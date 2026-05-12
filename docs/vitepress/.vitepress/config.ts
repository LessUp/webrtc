import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/webrtc/',
  title: 'LessUp WebRTC Docs',
  description: 'Go Signaling + Vanilla JS',

  // Output to docs/.site for GitHub Pages
  outDir: '../.site',
  cacheDir: '.vitepress/cache',

  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'LessUp WebRTC 文档',
      description: 'Go 信令服务器 + 原生 JavaScript',
      themeConfig: {
        nav: [
          { text: '技术指南', link: '/zh/guide', activeMatch: '/zh/' },
          { text: '部署', link: '/zh/deployment' },
          { text: 'API 参考', link: '/zh/api' },
          { text: 'GitHub', link: 'https://github.com/LessUp/webrtc' },
        ],
        sidebar: {
          '/zh/': [
            {
              text: '文档',
              items: [
                { text: '简介', link: '/zh/' },
                { text: '技术指南', link: '/zh/guide' },
                { text: '信令协议', link: '/zh/signaling' },
                { text: '部署', link: '/zh/deployment' },
                { text: 'API 参考', link: '/zh/api' },
                { text: 'OpenSpec', link: '/zh/specs' },
                { text: '故障排查', link: '/zh/troubleshooting' },
              ],
            },
          ],
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'LessUp WebRTC Docs',
      description: 'Go Signaling + Vanilla JS',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide', activeMatch: '/en/' },
          { text: 'Deployment', link: '/en/deployment' },
          { text: 'API Reference', link: '/en/api' },
          { text: 'GitHub', link: 'https://github.com/LessUp/webrtc' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Documentation',
              items: [
                { text: 'Introduction', link: '/en/' },
                { text: 'Technical Guide', link: '/en/guide' },
                { text: 'Signaling Protocol', link: '/en/signaling' },
                { text: 'Deployment', link: '/en/deployment' },
                { text: 'API Reference', link: '/en/api' },
                { text: 'OpenSpec', link: '/en/specs' },
                { text: 'Troubleshooting', link: '/en/troubleshooting' },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/LessUp/webrtc' },
    ],
  },
})
