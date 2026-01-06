import type React from "react"
import type { Metadata, Viewport } from "next"
import { Roboto, Roboto_Mono } from "next/font/google"
import "./globals.css"

const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-roboto" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" })

export const metadata: Metadata = {
  title: "No Punt - Poker Training",
  description: "Master poker decisions with AI-powered training",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${roboto.variable} ${robotoMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
