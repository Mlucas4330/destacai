import { motion } from 'framer-motion'
import { scoreColor } from '@/shared/utils/formatters'

interface MetricRingProps {
  label: string
  score: number
  hint?: string
  size?: number
}

const MetricRing = ({ label, score, hint, size = 56 }: MetricRingProps) => {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#57c878' : score >= 40 ? '#efa23c' : '#ee5b4d'

  return (
    <div className={`flex flex-col items-center gap-1 ${hint ? 'cursor-help' : ''}`} title={hint}>
      <div className='relative' style={{ width: size, height: size }}>
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
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className={`font-bold leading-none tabular-nums ${scoreColor(score)}`} style={{ fontSize: Math.round(size * 0.28) }}>
            {score}
          </span>
        </div>
      </div>
      <span className='text-[10px] text-navy-muted'>{label}</span>
    </div>
  )
}

export default MetricRing
