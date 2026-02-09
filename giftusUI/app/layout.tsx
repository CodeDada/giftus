import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/lib/cartContext'
import { AnalyticsProvider } from './analytics-provider'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TrophyBazaar - Premium Custom Trophies & Awards',
  description: 'India\'s trusted destination for custom trophies, awards, and corporate gifts. Serving corporates, schools, and event organizers with premium quality products.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <AnalyticsProvider />
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
