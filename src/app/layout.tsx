import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PhytoSense',
  description: 'Identify medicinal plants and predict their therapeutic properties.',
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
