import path from 'node:path'

// Next.js runs (both `next dev` and `next start`) with the project root as the
// working directory, so we resolve runtime assets relative to it. The server
// sources and their assets stay in the repo, and node_modules lives at the root.
export const rootDir = process.cwd()
export const assetsDir = path.join(process.cwd(), 'server', 'assets')
