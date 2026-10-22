import { Analytics } from '@vercel/analytics/next'
import Chatbot from '@/components/chatbot'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PoliVSR | Energia variável para uma rede mais resiliente',
  description: 'Protótipo PoliVSR: reatores de derivação variável para estabilizar a rede elétrica brasileira.',
  generator: 'v0.app',
  icons: {
    icon: {
      url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g fill='none' stroke='%230f172a' stroke-width='5'><ellipse cx='20' cy='50' rx='11' ry='32' transform='rotate(20 20 50)'/><ellipse cx='50' cy='50' rx='11' ry='32' transform='rotate(20 50 50)'/><ellipse cx='80' cy='50' rx='11' ry='32' transform='rotate(20 80 50)'/></g></svg>",
      type: 'image/svg+xml',
    },
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <Chatbot />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
