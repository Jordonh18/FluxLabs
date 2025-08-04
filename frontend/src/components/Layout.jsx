import React from 'react'
import { Navigation } from './Navigation'

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
