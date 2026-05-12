import React from 'react'
import { Rocket, Github, Sparkles } from 'lucide-react'

interface HeroProps {
  title: string
  subtitle: string
  description: string
  primaryCta: {
    text: string
    href: string
  }
  secondaryCta: {
    text: string
    href: string
  }
  stats: Array<{
    value: string
    label: string
    color: string
  }>
}

export function Hero({ title, subtitle, description, primaryCta, secondaryCta, stats }: HeroProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950 -z-10" />

      {/* Particle pattern overlay */}
      <div className="absolute inset-0 particle-pattern -z-10 animate-particle-float" />

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary-400/10 rounded-full blur-xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-accent-400/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-warning-400/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
            </span>
            <Sparkles className="w-4 h-4" />
            Production Ready v1.0.0
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            <span className="gradient-text-full">{title}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {subtitle}
          </p>

          {/* Description */}
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <a href={primaryCta.href} target="_blank" rel="noreferrer" className="btn-primary">
              <Github className="w-5 h-5" />
              {primaryCta.text}
            </a>
            <a href={secondaryCta.href} className="btn-secondary">
              <Rocket className="w-5 h-5" />
              {secondaryCta.text}
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
