import { NextResponse } from 'next/server'
import { requireUser, toErrorResponse } from '@server/lib/http'
import { uploadCv } from '@server/features/cv/service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    const buffer = await file.arrayBuffer()
    const result = await uploadCv(user.id, buffer, file.name, file.type)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
