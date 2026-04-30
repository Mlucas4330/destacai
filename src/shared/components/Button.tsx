import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  to?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

const variantClasses = {
  primary: 'bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50',
  secondary: 'bg-surface text-navy hover:bg-border disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-danger-hover disabled:opacity-50',
}

const Button = ({
  children,
  onClick,
  to,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) => {
  const navigate = useNavigate()

  return (
    <motion.button
      type={type}
      onClick={to ? () => navigate(to) : onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </motion.button>
  )
}

export default Button
