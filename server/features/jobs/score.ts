import { logger } from '@server/lib/logger'
import type { JDExtract } from '@server/shared/schemas'
import { scoreCV, scoreCvData } from '@server/features/jobs/service'
import {
  updateJobAtsStatus,
  updateJobGeneratedAtsStatus,
  getJobCvData,
} from '@server/features/jobs/repository'

export interface AtsScoringTask {
  jobId: string
  userId: string
  jobDescription: string
  cvR2Key: string
  target: 'uploaded' | 'generated'
  jdExtract?: JDExtract
  confirmedSkills?: string[]
}

/**
 * Score a CV against a job description. Runs in-process (no queue). Updates the
 * job row's ATS status to processing → done/failed; the frontend reads the
 * result by polling /jobs.
 */
export async function runAtsScoring(data: AtsScoringTask): Promise<void> {
  const { jobId, userId, jobDescription, cvR2Key, target, jdExtract } = data
  const logCtx = { jobId, target }
  logger.info({ ...logCtx, hasExtract: !!jdExtract }, 'ATS scoring started')

  try {
    if (target === 'generated') {
      await updateJobGeneratedAtsStatus(jobId, 'processing')
    } else {
      await updateJobAtsStatus(jobId, 'processing')
    }

    let result
    if (target === 'generated') {
      const stored = await getJobCvData(jobId, userId)
      result = stored?.cvData
        ? await scoreCvData(jobDescription, stored.cvData, logCtx, jdExtract)
        : await scoreCV(jobDescription, cvR2Key, logCtx, jdExtract)
    } else {
      result = await scoreCV(jobDescription, cvR2Key, logCtx, jdExtract)
    }
    const summary = result.strengths[0] ?? ''

    if (target === 'generated') {
      await updateJobGeneratedAtsStatus(jobId, 'done', result.score, summary, result)
    } else {
      await updateJobAtsStatus(jobId, 'done', result.score, summary, result)
    }
    logger.info({ ...logCtx, score: result.score }, 'ATS scoring completed')
  } catch (err) {
    logger.error({ ...logCtx, err: (err as Error).message }, 'ATS scoring failed')
    if (target === 'generated') {
      await updateJobGeneratedAtsStatus(jobId, 'failed')
    } else {
      await updateJobAtsStatus(jobId, 'failed')
    }
  }
}

/** Fire-and-forget background ATS scoring. Errors are handled inside runAtsScoring. */
export function enqueueAtsScoring(data: AtsScoringTask): void {
  void runAtsScoring(data)
}
