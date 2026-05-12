import React from 'react'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
  href?: string
}

export function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  const content = (
    <>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </>
  )

  if (href) {
    return (
      <a href={href} className="feature-card block hover:border-primary-500 dark:hover:border-primary-400">
        {content}
      </a>
    )
  }

  return <div className="feature-card">{content}</div>
}
