import { useRouter } from 'next/router'
import { LanguageToggle } from './components/LanguageToggle'

const config = {
  logo: (
    <>
      <span className="font-bold text-xl flex items-center gap-2">
        <span className="text-2xl">📹</span>
        <span className="gradient-text">LessUp WebRTC</span>
      </span>
    </>
  ),
  project: {
    link: 'https://github.com/LessUp/webrtc',
  },
  docsRepositoryBase: 'https://github.com/LessUp/webrtc/tree/main/docs/website',
  useNextSeoProps() {
    const { asPath } = useRouter()
    const title = asPath === '/'
      ? 'LessUp WebRTC - Go Signaling + Vanilla JS'
      : '%s – LessUp WebRTC'
    return {
      titleTemplate: title,
      description: 'A compact WebRTC demo with Go signaling server, vanilla JavaScript client, and OpenSpec-driven maintenance',
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://lessup.github.io/webrtc',
        siteName: 'LessUp WebRTC',
      },
      twitter: {
        cardType: 'summary_large_image',
      },
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="A compact WebRTC demo with Go signaling, vanilla JS frontend, and OpenSpec-driven workflow" />
      <meta property="og:title" content="LessUp WebRTC" />
      <meta property="og:description" content="Go signaling server + vanilla JavaScript WebRTC client" />
      <link rel="icon" type="image/svg+xml" href="/webrtc/favicon.svg" />
      <meta name="theme-color" content="#00ADD8" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    </>
  ),
  search: {
    placeholder: 'Search documentation...',
  },
  toc: {
    title: 'On This Page',
  },
  editLink: {
    text: 'Edit this page on GitHub →',
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'documentation',
  },
  footer: {
    text: (
      <div className="flex flex-col gap-2">
        <span>
          MIT {new Date().getFullYear()} ©{' '}
          <a href="https://github.com/LessUp" target="_blank" rel="noreferrer" className="hover:text-primary-500 transition-colors">
            LessUp
          </a>
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Built with Nextra, Next.js & Tailwind CSS
        </span>
      </div>
    ),
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system',
    storageKey: 'webrtc-theme',
  },
  banner: {
    key: 'v1.0.0-release',
    text: (
      <a href="https://github.com/LessUp/webrtc/releases" target="_blank" rel="noreferrer">
        🎉 LessUp WebRTC v1.0.0 is released. Read more →
      </a>
    ),
  },
  navbar: {
    extraContent: <LanguageToggle />,
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  navigation: {
    prev: true,
    next: true,
  },
}

export default config
