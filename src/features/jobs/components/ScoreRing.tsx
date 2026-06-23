import { motion } from 'framer-motion'
import { scoreColor } from '@/shared/utils/formatters'

interface ScoreRingProps {
  score: number
  size?: number
}

const ScoreRing = ({ score, size = 52 }: ScoreRingProps) => {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#57c878' : score >= 40 ? '#efa23c' : '#ee5b4d'

  return (
    <div className='relative shrink-0' style={{ width: size, height: size }}>
      <svg width={size} height={size} className='-rotate-90'>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='currentColor' strokeWidth={3} className='text-border' />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill='none'
          stroke={color}
          strokeWidth={3}
          strokeLinecap='round'
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className={`font-bold leading-none tabular-nums ${scoreColor(score)}`} style={{ fontSize: Math.round(size * 0.25) }}>
          {score}
        </span>
        <span className='text-navy-muted leading-none mt-0.5' style={{ fontSize: Math.round(size * 0.14) }}>/ 100</span>
      </div>
    </div>
  )
}

export default ScoreRing
