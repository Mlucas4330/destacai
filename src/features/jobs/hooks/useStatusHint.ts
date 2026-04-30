import { useState } from 'react'

export function useStatusHint() {
  const [showHint, setShowHint] = useState(() => localStorage.getItem('statusHintDismissed') !== 'true')

  const dismissHint = () => {
    localStorage.setItem('statusHintDismissed', 'true')
    setShowHint(false)
  }

  return { showHint, dismissHint }
}
