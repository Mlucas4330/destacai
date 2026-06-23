import { Trophy, Target, Rocket, PenLine, Briefcase, GraduationCap, Award, Wand2, Crown, BadgeCheck, Medal, Gem } from 'lucide-react'
import type { Badge } from '@/shared/utils/badges'

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  target: Target,
  rocket: Rocket,
  'pen-line': PenLine,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  award: Award,
  'wand-2': Wand2,
  crown: Crown,
  'badge-check': BadgeCheck,
  medal: Medal,
  gem: Gem,
}

interface BadgeRowProps {
  badges: Badge[]
}

const BadgeRow = ({ badges }: BadgeRowProps) => (
  <div className='flex flex-wrap gap-1'>
    {badges.map((b) => {
      const Icon = ICON_MAP[b.icon] ?? Medal
      return (
        <span
          key={b.id}
          title={`${b.label}: ${b.description}`}
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium cursor-help ${b.cls}`}
        >
          <Icon size={11} className='shrink-0' /> {b.label}
        </span>
      )
    })}
  </div>
)

export default BadgeRow
