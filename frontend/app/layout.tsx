import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Credit Card Statement Parser',
  description: 'Extract standardized data from credit card statements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}