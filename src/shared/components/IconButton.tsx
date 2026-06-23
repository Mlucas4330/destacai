import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface IconButtonProps {
  icon: LucideIcon
  onClick?: () => void
  label: string
  variant?: 'default' | 'danger'
  disabled?: boolean
  size?: number
}

const variantClasses = {
  default: 'text-navy-muted hover:text-navy hover:bg-surface',
  danger: 'text-navy-muted hover:text-danger hover:bg-danger-surface',
}

const IconButton = ({
  icon: Icon,
  onClick,
  label,
  variant = 'default',
  disabled = false,
  size = 16,
}: IconButtonProps) => {
  return (
    <motion.button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      className={`p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]}`}
    >
      <Icon size={size} />
    </motion.button>
  )
}

export default IconButton
