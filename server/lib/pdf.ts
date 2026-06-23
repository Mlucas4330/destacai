import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { logger } from '@server/lib/logger'
import { rootDir } from '@server/lib/paths'

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(rootDir, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
).href

const standardFontDataUrl =
  pathToFileURL(path.join(rootDir, 'node_modules/pdfjs-dist/standard_fonts')).href + '/'

const log = logger.child({ lib: 'pdf' })

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  log.debug({ sizeBytes: buffer.length }, 'extractTextFromPDF')
  const doc = await getDocument({ data: new Uint8Array(buffer), standardFontDataUrl }).promise
  const pages: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()

    const lineMap = new Map<number, { x: number; str: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push({ x, str: item.str })
    }

    const sortedLines = Array.from(lineMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').trim())
      .filter(line => line.length > 0)

    pages.push(sortedLines.join('\n'))
  }

  log.debug({ pages: pages.length }, 'extractTextFromPDF done')
  return pages.join('\n\n')
}
