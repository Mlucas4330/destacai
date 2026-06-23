import { z } from 'zod'
import { createElement, type ReactElement } from 'react'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import { AppError } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import { uploadToR2, deleteFromR2, getR2Object } from '@server/lib/r2'
import { enqueueAtsScoring } from '@server/features/jobs/score'
import { CVDataSchema } from '@server/shared/schemas'
import type { JDExtract } from '@server/shared/schemas'
import { extractTextFromPDF } from '@server/lib/pdf'
import { generateTailoredCv } from '@server/features/cv/pipeline'
import CVTemplatePDF from '@server/assets/cvTemplate'
import { CV_MAX_SIZE_BYTES } from '@server/constants'
import { findUserById, updateUserCv, clearUserCv } from '@server/features/users/repository'
import { findIdleJobsForUser, updateJobAtsStatus } from '@server/features/jobs/repository'

const log = logger.child({ service: 'CvService' })

function capitalize(word: string): string {
  if (!word) return ''
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).map(capitalize)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

export async function renderCVFromData(cvData: z.infer<typeof CVDataSchema>): Promise<Buffer> {
  const pdfBlob = await pdf(
    createElement(CVTemplatePDF, { data: cvData }) as unknown as ReactElement<DocumentProps>,
  ).toBlob()
  return Buffer.from(await pdfBlob.arrayBuffer())
}

export async function generatePDF(
  cvR2Key: string,
  jobDescription: string,
  logCtx: object,
  jdExtract?: JDExtract,
  userAnswers?: Record<string, boolean>,
) {
  log.info({ ...logCtx, cvR2Key, hasExtract: !!jdExtract }, 'fetching original CV from R2')
  const cvBuffer = await getR2Object(cvR2Key)

  log.info({ ...logCtx, sizeBytes: cvBuffer.length }, 'extracting text from PDF')
  const cvText = await extractTextFromPDF(cvBuffer)
  log.info({ ...logCtx, cvTextLength: cvText.length }, 'PDF text extracted')

  const output = await generateTailoredCv({ cvText, jobDescription, jdExtract, userAnswers, logCtx })
  log.info({ ...logCtx, outputName: output.name }, 'tailored CV generated and validated')

  log.info(logCtx, 'rendering PDF')
  const pdfBuffer = await renderCVFromData(output)
  log.info({ ...logCtx, pdfSizeBytes: pdfBuffer.length }, 'PDF rendered')

  return { output, pdfBuffer }
}

export async function uploadCv(userId: string, buffer: ArrayBuffer, fileName: string, contentType: string) {
  log.info({ userId, fileName, size: buffer.byteLength }, 'uploadCv')
  if (contentType !== 'application/pdf') throw new AppError('Only PDF files are accepted', 400)
  if (buffer.byteLength > CV_MAX_SIZE_BYTES) throw new AppError('File too large (max 10MB)', 400)
  const user = await findUserById(userId)
  if (!user) throw new AppError('User not found', 404)
  if (user.cvR2Key) {
    log.info({ userId, oldKey: user.cvR2Key }, 'deleting previous CV')
    await deleteFromR2(user.cvR2Key)
  }
  const key = `cvs/${userId}/${Date.now()}.pdf`
  await uploadToR2(key, Buffer.from(buffer), contentType)
  await updateUserCv(userId, key, fileName)
  log.info({ userId, key }, 'CV uploaded')
  const idleJobs = await findIdleJobsForUser(userId)
  log.info({ userId, idleJobCount: idleJobs.length }, 'enqueuing ATS for idle jobs')
  for (const job of idleJobs) {
    await updateJobAtsStatus(job.id, 'queued')
    enqueueAtsScoring({
      jobId: job.id,
      userId,
      jobDescription: job.description,
      cvR2Key: key,
      target: 'uploaded',
      ...(job.jdExtract ? { jdExtract: job.jdExtract } : {}),
    })
  }
  return { cvFileName: fileName, cvR2Key: key }
}

export async function deleteCv(userId: string) {
  log.info({ userId }, 'deleteCv')
  const user = await findUserById(userId)
  if (!user) throw new AppError('User not found', 404)
  if (!user.cvR2Key) throw new AppError('No CV on file', 404)
  await deleteFromR2(user.cvR2Key)
  await clearUserCv(userId)
  log.info({ userId }, 'CV deleted')
}
