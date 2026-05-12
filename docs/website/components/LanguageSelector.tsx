import React from 'react'
import { useRouter } from 'next/router'

export function LanguageSelector() {
  const router = useRouter()

  const languages = [
    { code: 'en', flag: '🇺🇸', label: 'English', description: 'Read documentation in English' },
    { code: 'zh', flag: '🇨🇳', label: '简体中文', description: '阅读中文文档' },
  ]

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold mb-4 gradient-text">LessUp WebRTC</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
          Choose your language / 选择语言
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => router.push(`/${lang.code}`)}
              className="language-card group text-left"
            >
              <span className="lang-flag">{lang.flag}</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {lang.label}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {lang.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
