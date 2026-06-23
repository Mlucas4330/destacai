import { motion } from 'framer-motion'
import { scoreColor } from '@/shared/utils/formatters'

interface SubScoreBarProps {
  value: number
  delta?: number
}

const SubScoreBar = ({ value, delta }: SubScoreBarProps) => {
  const color = value >= 70 ? 'bg-success' : value >= 40 ? 'bg-warn' : 'bg-danger'

  return (
    <div className='flex items-center gap-1 min-w-0'>
      <div className='flex-1 h-1 bg-border rounded-full overflow-hidden'>
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-[10px] tabular-nums w-5 text-right ${scoreColor(value)}`}>{value}</span>
      {delta !== undefined && delta !== 0 && (
        <span className={`text-[9px] tabular-nums font-semibold w-6 text-right ${delta > 0 ? 'text-success-text' : 'text-danger'}`}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  )
}

export default SubScoreBar
