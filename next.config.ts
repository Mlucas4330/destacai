import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // These packages do native / Node-only work (PDF parsing & rendering, bcrypt,
  // logging) and must not be bundled by the server compiler.
  serverExternalPackages: ['pdfjs-dist', '@react-pdf/renderer', 'bcryptjs', 'pino'],
}

export default nextConfig
