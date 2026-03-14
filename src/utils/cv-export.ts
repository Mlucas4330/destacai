function mdToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)(?=\n(?!<li>)|\n*$)/g, '<ul>$1</ul>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hul]|<\/)/gm, '')
    .replace(/<p><\/p>/g, '')
}

export function previewCv(tailoredCv: string, companyName: string, jobTitle: string) {
  const body = mdToHtml(tailoredCv)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CV – ${jobTitle} at ${companyName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; font-size: 14px; color: #1a1a2e; background: #fff; max-width: 800px; margin: 48px auto; padding: 0 32px 64px; line-height: 1.65; }
    h1 { font-size: 26px; font-weight: bold; margin-bottom: 2px; }
    h2 { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 28px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1.5px solid #1a1a2e; }
    h3 { font-size: 13px; font-weight: bold; margin-top: 14px; margin-bottom: 2px; }
    ul { padding-left: 18px; margin: 4px 0 10px; }
    li { margin-bottom: 3px; }
    p { margin: 4px 0; }
    strong { font-weight: bold; }
    @media print { body { margin: 0; padding: 24px 32px; } }
  </style>
</head>
<body>${body}</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

export async function downloadCvAsPdf(
  tailoredCv: string,
  companyName: string,
  jobTitle: string,
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = margin

  const newPage = () => {
    doc.addPage()
    y = margin
  }

  const checkY = (needed: number) => {
    if (y + needed > pageH - margin) newPage()
  }

  const lines = tailoredCv.split('\n')

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('# ')) {
      const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '$1')
      checkY(12)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(text, margin, y)
      y += 9

    } else if (line.startsWith('## ')) {
      const text = line.slice(3).replace(/\*\*(.+?)\*\*/g, '$1')
      checkY(14)
      y += 4
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(text.toUpperCase(), margin, y)
      y += 2
      doc.setDrawColor(26, 26, 46)
      doc.setLineWidth(0.4)
      doc.line(margin, y, pageW - margin, y)
      y += 5

    } else if (line.startsWith('### ')) {
      const text = line.slice(4).replace(/\*\*(.+?)\*\*/g, '$1')
      checkY(8)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(text, margin, y)
      y += 5.5

    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const text = line.replace(/^[-•] /, '').replace(/\*\*(.+?)\*\*/g, '$1')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const wrapped = doc.splitTextToSize(text, contentW - 8)
      checkY(wrapped.length * 5)
      doc.text('•', margin + 2, y)
      doc.text(wrapped, margin + 6, y)
      y += wrapped.length * 5 + 1

    } else if (line.trim() === '') {
      y += 2.5

    } else {
      const text = line.replace(/\*\*(.+?)\*\*/g, '$1')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const wrapped = doc.splitTextToSize(text, contentW)
      checkY(wrapped.length * 5)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5 + 1
    }
  }

  const safe = (s: string) => s.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
  doc.save(`CV_${safe(companyName)}_${safe(jobTitle)}.pdf`)
}
