import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  type?: 'text' | 'password' | 'email'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const resolvedType = type === 'password' && showPassword ? 'text' : type

    return (
      <div className='flex flex-col gap-1'>
        {label && (
          <label htmlFor={id} className='text-xs font-medium text-navy-muted'>{label}</label>
        )}
        <div className='relative'>
          <input
            id={id}
            type={resolvedType}
            ref={ref}
            className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors bg-bg
              ${type === 'password' ? 'pr-9' : ''}
              ${error
        ? 'border-danger focus:border-danger'
        : 'border-border focus:border-navy-muted'
      }`}
            {...props}
          />
          {type === 'password' && (
            <motion.button
              type='button'
              onClick={() => setShowPassword((prev) => !prev)}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-navy-muted hover:text-navy transition-colors'
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </motion.button>
          )}
        </div>
        {error && <span className='text-xs text-danger'>{error}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
