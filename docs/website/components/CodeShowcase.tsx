import React, { useState } from 'react'

interface CodeTab {
  label: string
  code: string
  language?: string
}

interface CodeShowcaseProps {
  tabs: CodeTab[]
}

export function CodeShowcase({ tabs }: CodeShowcaseProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="code-block">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code content */}
      <div className="p-4">
        <pre className="!bg-transparent !border-0 !p-0 !m-0">
          <code className={`language-${tabs[activeTab].language || 'bash'}`}>
            {tabs[activeTab].code}
          </code>
        </pre>
      </div>
    </div>
  )
}
