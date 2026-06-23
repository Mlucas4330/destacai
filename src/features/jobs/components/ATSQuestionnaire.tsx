import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { X, Check, ArrowRight, Undo2 } from 'lucide-react'
import Button from '@/shared/components/Button'
import { useGenerateCV } from '../hooks/useJobs'
import type { AtsBreakdown, AtsGap } from '../types'
import GapIcon from './GapIcon'

interface Props {
  jobId: string
  breakdown: AtsBreakdown
  initialAnswers?: Record<string, boolean>
  onClose: () => void
}

const SWIPE_THRESHOLD = 100

function isHighImpact(gap: AtsGap): boolean {
  return gap.context.toLowerCase().startsWith('required')
}

// Start the deck at the first gap the user hasn't already answered (re-tailoring case).
function firstUnansweredIndex(gaps: AtsGap[], answers: Record<string, boolean>): number {
  const i = gaps.findIndex((g) => answers[g.label] === undefined)
  return i === -1 ? gaps.length : i
}

const ATSQuestionnaire = ({ jobId, breakdown, initialAnswers, onClose }: Props) => {
  const [answers, setAnswers] = useState<Record<string, boolean>>(initialAnswers ?? {})
  const [index, setIndex] = useState(() => firstUnansweredIndex(breakdown.gaps, initialAnswers ?? {}))
  const [exitX, setExitX] = useState(0)
  const draggingRef = useRef(false)
  const generateCV = useGenerateCV(jobId, onClose)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-150, 150], [-12, 12])
  const yesOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1])
  const noOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0])

  const totalSkills = breakdown.keywords?.length ?? breakdown.gaps.length
  const baseCovered = breakdown.keywords
    ? breakdown.keywords.filter((k) => k.present).length
    : Math.max(totalSkills - breakdown.gaps.length, 0)
  const yesCount = breakdown.gaps.filter((g) => answers[g.label] === true).length
  const noCount = breakdown.gaps.filter((g) => answers[g.label] === false).length
  const projectedCovered = Math.min(baseCovered + yesCount, totalSkills)

  const finished = index >= breakdown.gaps.length
  const currentGap = finished ? undefined : breakdown.gaps[index]
  const nextGap = breakdown.gaps[index + 1]

  function commit(gap: AtsGap, value: boolean) {
    setExitX(value ? 400 : -400)
    setAnswers((prev) => ({ ...prev, [gap.label]: value }))
    x.set(0)
    setIndex((i) => i + 1)
  }

  function rewind() {
    if (index === 0) return
    const prevGap = breakdown.gaps[index - 1]
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[prevGap.label]
      return next
    })
    x.set(0)
    setIndex((i) => i - 1)
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    setTimeout(() => { draggingRef.current = false })
    if (!currentGap) return
    if (info.offset.x > SWIPE_THRESHOLD) commit(currentGap, true)
    else if (info.offset.x < -SWIPE_THRESHOLD) commit(currentGap, false)
    else x.set(0)
  }

  function handleBackdropClick() {
    if (draggingRef.current) return
    onClose()
  }

  function handleGenerate() {
    generateCV.mutate({ answers, tailored: true })
  }

  function handleSkip() {
    generateCV.mutate({ answers: undefined, tailored: false })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm'
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className='w-full max-w-lg bg-bg rounded-t-2xl border border-border border-b-0 shadow-xl overflow-hidden'
      >
        <div className='py-4 px-12 space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-semibold text-navy'>Cover more of the role</p>
              <p className='text-xs text-navy-muted opacity-70'>
                {finished
                  ? 'Review and generate your tailored CV'
                  : 'Swipe right if you have the skill, left if you don’t'}
              </p>
            </div>
            <button onClick={onClose} className='text-navy-muted hover:text-navy transition-colors p-1'>
              <X size={16} />
            </button>
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-center justify-between text-xs text-navy-muted'>
              <span>Role skills covered</span>
              <span className='font-semibold text-navy tabular-nums'>{projectedCovered} / {totalSkills}</span>
            </div>
            <div className='h-1.5 w-full rounded-full bg-border overflow-hidden'>
              <motion.div
                className='h-full rounded-full bg-success'
                initial={false}
                animate={{ width: `${totalSkills ? (projectedCovered / totalSkills) * 100 : 0}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <p className='text-[10px] text-navy-muted opacity-60'>Confirming a skill adds it to your CV. Your overall ATS match score is rated separately after tailoring.</p>
          </div>

          {finished ? (
            <div className='rounded-xl border border-border p-4 space-y-3'>
              <p className='text-xs font-semibold text-navy text-center'>
                {breakdown.gaps.length === 0 ? 'Ready to tailor your CV' : 'All skills reviewed'}
              </p>
              {breakdown.gaps.length > 0 && (
                <div className='flex justify-center gap-4 text-xs'>
                  <span className='flex items-center gap-1 text-success-text font-medium'>
                    <Check size={12} /> {yesCount} have
                  </span>
                  <span className='flex items-center gap-1 text-danger font-medium'>
                    <X size={12} /> {noCount} skip
                  </span>
                </div>
              )}
              {index > 0 && (
                <button
                  onClick={rewind}
                  className='w-full flex items-center justify-center gap-1 text-xs font-medium text-navy-muted hover:text-navy transition-colors'
                >
                  <Undo2 size={12} /> Review last skill
                </button>
              )}
            </div>
          ) : (
            <div className='relative h-44'>
              {/* Next card peeking behind for a deck feel */}
              {nextGap && (
                <div className='absolute inset-x-2 top-2 bottom-0 rounded-xl border border-border bg-surface/40 scale-95' />
              )}

              <AnimatePresence initial={false}>
                <motion.div
                  key={currentGap!.label}
                  style={{ x, rotate }}
                  drag='x'
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragStart={() => { draggingRef.current = true }}
                  onDragEnd={handleDragEnd}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
                  className='absolute inset-0 flex flex-col justify-between rounded-xl border border-border bg-bg p-4 cursor-grab active:cursor-grabbing shadow-sm'
                >
                  {/* Swipe direction overlays */}
                  <motion.span
                    style={{ opacity: yesOpacity }}
                    className='absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-md border-2 border-success-text text-success-text rotate-12'
                  >
                    HAVE IT
                  </motion.span>
                  <motion.span
                    style={{ opacity: noOpacity }}
                    className='absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-md border-2 border-danger text-danger -rotate-12'
                  >
                    SKIP
                  </motion.span>

                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <span className='text-navy-muted'>
                        <GapIcon name={currentGap!.icon} />
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isHighImpact(currentGap!) ? 'bg-warn-surface text-warn' : 'bg-surface text-navy-muted'
                        }`}
                      >
                        {isHighImpact(currentGap!) ? 'High impact' : 'Medium impact'}
                      </span>
                    </div>
                  </div>

                  <div className='min-w-0'>
                    <p className='text-base font-semibold text-navy truncate'>{currentGap!.label}</p>
                    <p className='text-xs text-navy-muted opacity-70 truncate'>{currentGap!.context}</p>
                  </div>

                  <p className='text-[10px] text-navy-muted opacity-50 text-center'>
                    Drag the card or use the buttons below
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {!finished && (
            <div className='flex gap-2'>
              <button
                onClick={() => commit(currentGap!, false)}
                className='flex-1 text-xs py-1.5 rounded-lg font-medium border border-border text-navy-muted hover:border-danger hover:text-danger transition-all'
              >
                <span className='flex items-center justify-center gap-1'>No <X size={11} /></span>
              </button>
              <button
                onClick={rewind}
                disabled={index === 0}
                className='shrink-0 px-3 py-1.5 rounded-lg border border-border text-navy-muted hover:text-navy disabled:opacity-30 disabled:hover:text-navy-muted transition-all'
                aria-label='Undo last answer'
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={() => commit(currentGap!, true)}
                className='flex-1 text-xs py-1.5 rounded-lg font-medium border border-border text-navy-muted hover:border-success-text hover:text-success-text transition-all'
              >
                <span className='flex items-center justify-center gap-1'>Yes <Check size={11} /></span>
              </button>
            </div>
          )}

          {breakdown.gaps.length > 0 && (
            <div className='flex items-center gap-1.5 flex-wrap'>
              {breakdown.gaps.map((g, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    answers[g.label] !== undefined ? 'bg-accent' : i === index ? 'bg-navy-muted' : 'bg-border'
                  }`}
                />
              ))}
              <span className='text-[10px] text-navy-muted ml-1'>
                {Math.min(index, breakdown.gaps.length)}/{breakdown.gaps.length} answered
              </span>
            </div>
          )}

          {finished && (
            <div className='flex gap-2 pt-1'>
              <Button
                variant='secondary'
                onClick={handleSkip}
                disabled={generateCV.isPending}
                className='flex-1 text-xs py-2'
              >
                Skip
              </Button>
              <Button
                variant='primary'
                onClick={handleGenerate}
                disabled={generateCV.isPending}
                className='flex-2 text-xs py-2 font-semibold text-center'
              >
                {generateCV.isPending ? 'Starting...' : <span className='flex items-center justify-center gap-1'>Generate CV <ArrowRight size={12} /></span>}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ATSQuestionnaire
