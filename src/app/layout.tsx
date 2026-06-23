import type { Metadata } from 'next'
import './globals.css'
import NavBar from "../components/NavBar";
import { LanguageProvider } from "../i18n/LanguageContext";

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
      <body>
        <LanguageProvider>
          <NavBar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
