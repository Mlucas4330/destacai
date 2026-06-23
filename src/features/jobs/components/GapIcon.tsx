import { Code2, Users, Cloud, Briefcase, GraduationCap, Wrench, Database, Globe, BarChart2, Shield, Cpu, Layers } from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  'code-2': Code2,
  users: Users,
  cloud: Cloud,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  wrench: Wrench,
  database: Database,
  globe: Globe,
  'bar-chart': BarChart2,
  shield: Shield,
  cpu: Cpu,
  layers: Layers,
}

interface GapIconProps {
  name: string
}

const GapIcon = ({ name }: GapIconProps) => {
  const Icon = ICON_MAP[name] ?? Briefcase
  return <Icon size={15} className='shrink-0' />
}

export default GapIcon
