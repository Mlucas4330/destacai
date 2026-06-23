import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import Button from '@/shared/components/Button'
import { useGetCvData, useUpdateCvData } from '../hooks/useJobs'
import type { CVData, CVEntry, CVEducation } from '../types'

interface CVEditorProps {
  jobId: string
  onClose: () => void
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-xs font-medium text-navy-muted'>{label}</label>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full px-3 py-1.5 rounded-xl border border-border text-sm outline-none transition-colors bg-bg focus:border-navy-muted'
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-xs font-medium text-navy-muted'>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className='w-full px-3 py-1.5 rounded-xl border border-border text-sm outline-none transition-colors bg-bg focus:border-navy-muted resize-none'
      />
    </div>
  )
}

function EntryEditor({
  entry,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemoveBullet,
  onAddBullet,
  onBulletChange,
}: {
  entry: CVEntry
  index: number
  total: number
  onChange: (field: keyof CVEntry, value: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemoveBullet: (bi: number) => void
  onAddBullet: () => void
  onBulletChange: (bi: number, value: string) => void
}) {
  return (
    <div className='border border-border rounded-xl p-3 flex flex-col gap-3 bg-surface'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-semibold text-navy-muted'>{entry.org || `Entry ${index + 1}`}</span>
        <div className='flex gap-1'>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className='p-1 rounded-lg text-navy-muted hover:text-navy disabled:opacity-30 transition-colors'
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className='p-1 rounded-lg text-navy-muted hover:text-navy disabled:opacity-30 transition-colors'
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <TextField label='Organization' value={entry.org} onChange={(v) => onChange('org', v)} />
        <TextField label='Role' value={entry.role} onChange={(v) => onChange('role', v)} />
        <TextField label='Location' value={entry.location} onChange={(v) => onChange('location', v)} />
        <TextField label='Dates' value={entry.dates} onChange={(v) => onChange('dates', v)} />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label className='text-xs font-medium text-navy-muted'>Bullets</label>
        {entry.bullets.map((bullet, bi) => (
          <div key={bi} className='flex gap-2 items-start'>
            <textarea
              value={bullet}
              onChange={(e) => onBulletChange(bi, e.target.value)}
              rows={2}
              className='flex-1 px-3 py-1.5 rounded-xl border border-border text-sm outline-none transition-colors bg-bg focus:border-navy-muted resize-none'
            />
            <button
              onClick={() => onRemoveBullet(bi)}
              className='mt-1 p-1 rounded-lg text-navy-muted hover:text-danger transition-colors shrink-0'
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={onAddBullet}
          className='flex items-center gap-1 text-xs text-navy-muted hover:text-navy transition-colors self-start mt-0.5'
        >
          <Plus size={12} />
          Add bullet
        </button>
      </div>
    </div>
  )
}

function EducationEditor({
  entry,
  onChange,
}: {
  entry: CVEducation
  onChange: (field: keyof CVEducation, value: string) => void
}) {
  return (
    <div className='border border-border rounded-xl p-3 bg-surface'>
      <div className='grid grid-cols-2 gap-2'>
        <TextField label='University' value={entry.university} onChange={(v) => onChange('university', v)} />
        <TextField label='Degree' value={entry.degree} onChange={(v) => onChange('degree', v)} />
        <TextField label='Location' value={entry.location} onChange={(v) => onChange('location', v)} />
        <TextField label='Dates' value={entry.dates} onChange={(v) => onChange('dates', v)} />
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className='text-xs font-semibold text-navy uppercase tracking-wide mt-2'>{title}</h3>
}

const CVEditor = ({ jobId, onClose }: CVEditorProps) => {
  const { data: cvData, isLoading, isError } = useGetCvData(jobId, true)
  const updateCvData = useUpdateCvData(jobId)
  const [form, setForm] = useState<CVData | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (cvData) setForm(structuredClone(cvData))
  }, [cvData])

  const isDirty = form && cvData ? JSON.stringify(form) !== JSON.stringify(cvData) : false

  function handleClose() {
    if (isDirty) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  function updateField<K extends keyof CVData>(field: K, value: CVData[K]) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  function updateEntryField(section: 'experience' | 'leadership', index: number, field: keyof CVEntry, value: string) {
    setForm((prev) => {
      if (!prev) return prev
      const entries = prev[section].map((e, i) => i === index ? { ...e, [field]: value } : e)
      return { ...prev, [section]: entries }
    })
  }

  function updateBullet(section: 'experience' | 'leadership', entryIndex: number, bulletIndex: number, value: string) {
    setForm((prev) => {
      if (!prev) return prev
      const entries = prev[section].map((e, i) => {
        if (i !== entryIndex) return e
        const bullets = e.bullets.map((b, bi) => bi === bulletIndex ? value : b)
        return { ...e, bullets }
      })
      return { ...prev, [section]: entries }
    })
  }

  function addBullet(section: 'experience' | 'leadership', entryIndex: number) {
    setForm((prev) => {
      if (!prev) return prev
      const entries = prev[section].map((e, i) =>
        i === entryIndex ? { ...e, bullets: [...e.bullets, ''] } : e
      )
      return { ...prev, [section]: entries }
    })
  }

  function removeBullet(section: 'experience' | 'leadership', entryIndex: number, bulletIndex: number) {
    setForm((prev) => {
      if (!prev) return prev
      const entries = prev[section].map((e, i) => {
        if (i !== entryIndex) return e
        return { ...e, bullets: e.bullets.filter((_, bi) => bi !== bulletIndex) }
      })
      return { ...prev, [section]: entries }
    })
  }

  function moveEntry(section: 'experience' | 'leadership', index: number, direction: -1 | 1) {
    setForm((prev) => {
      if (!prev) return prev
      const entries = [...prev[section]]
      const target = index + direction
      if (target < 0 || target >= entries.length) return prev
      ;[entries[index], entries[target]] = [entries[target], entries[index]]
      return { ...prev, [section]: entries }
    })
  }

  function updateEducationField(index: number, field: keyof CVEducation, value: string) {
    setForm((prev) => {
      if (!prev) return prev
      const education = prev.education.map((e, i) => i === index ? { ...e, [field]: value } : e)
      return { ...prev, education }
    })
  }

  function handleSave() {
    if (!form) return
    updateCvData.mutate(form, { onSuccess: () => onClose() })
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/40'
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className='w-full max-w-3xl bg-bg border border-border rounded-t-2xl shadow-xl flex flex-col max-h-[90vh]'
      >
        <div className='flex items-center justify-between px-4 py-3 border-b border-border shrink-0'>
          <span className='text-sm font-semibold text-navy'>Edit CV</span>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setIsCollapsed((v) => !v)}
              className='text-navy-muted hover:text-navy transition-colors'
              title={isCollapsed ? 'Expand editor' : 'Collapse to overview'}
            >
              <Layers size={15} />
            </button>
            <button onClick={handleClose} className='text-navy-muted hover:text-navy transition-colors'>
              <X size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence mode='wait'>
          {isCollapsed && form ? (
            <motion.div
              key='overview'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className='px-4 py-4 flex flex-col gap-3'
            >
              <div className='grid grid-cols-2 gap-2'>
                <div className='bg-surface border border-border rounded-xl px-3 py-2'>
                  <p className='text-[10px] text-navy-muted uppercase tracking-wide mb-0.5'>Name</p>
                  <p className='text-xs font-medium text-navy truncate'>{form.name}</p>
                </div>
                <div className='bg-surface border border-border rounded-xl px-3 py-2'>
                  <p className='text-[10px] text-navy-muted uppercase tracking-wide mb-0.5'>Email</p>
                  <p className='text-xs font-medium text-navy truncate'>{form.email}</p>
                </div>
              </div>
              <div className='bg-surface border border-border rounded-xl px-3 py-2'>
                <p className='text-[10px] text-navy-muted uppercase tracking-wide mb-0.5'>Skills</p>
                <p className='text-xs text-navy truncate'>
                  {form.skills.technical.slice(0, 80)}{form.skills.technical.length > 80 ? '…' : ''}
                </p>
              </div>
              <div className='grid grid-cols-3 gap-2'>
                {[
                  { label: 'Experience', count: form.experience.length },
                  { label: 'Education', count: form.education.length },
                  { label: 'Leadership', count: form.leadership.length },
                ].map(({ label, count }) => (
                  <div key={label} className='bg-surface border border-border rounded-xl px-3 py-2 text-center'>
                    <p className='text-lg font-bold text-navy'>{count}</p>
                    <p className='text-[10px] text-navy-muted'>{label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsCollapsed(false)}
                className='text-xs text-navy-muted hover:text-navy transition-colors text-center'
              >
                Expand to edit
              </button>
            </motion.div>
          ) : (
            <motion.div
              key='editor'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className='flex-1 overflow-y-auto px-8 py-4 flex flex-col gap-4 min-h-0'
            >
              {isLoading && (
                <p className='text-sm text-navy-muted text-center py-8'>Loading CV data...</p>
              )}
              {isError && (
                <p className='text-sm text-navy-muted text-center py-8'>
                  CV editing is not available for this entry. Re-generate the CV to enable editing.
                </p>
              )}
              {form && (
                <>
                  <SectionHeader title='Personal Info' />
                  <div className='grid grid-cols-2 gap-2'>
                    <TextField label='Name' value={form.name} onChange={(v) => updateField('name', v)} />
                    <TextField label='Email' value={form.email} onChange={(v) => updateField('email', v)} />
                    <TextField label='LinkedIn' value={form.linkedin} onChange={(v) => updateField('linkedin', v)} />
                    <TextField label='GitHub' value={form.github} onChange={(v) => updateField('github', v)} />
                  </div>

                  <SectionHeader title='Skills' />
                  <TextArea
                    label='Technical'
                    value={form.skills.technical}
                    onChange={(v) => updateField('skills', { ...form.skills, technical: v })}
                  />
                  <TextArea
                    label='Languages'
                    value={form.skills.languages}
                    onChange={(v) => updateField('skills', { ...form.skills, languages: v })}
                  />

                  <SectionHeader title='Experience' />
                  {form.experience.map((entry, i) => (
                    <EntryEditor
                      key={i}
                      entry={entry}
                      index={i}
                      total={form.experience.length}
                      onChange={(field, value) => updateEntryField('experience', i, field, value)}
                      onMoveUp={() => moveEntry('experience', i, -1)}
                      onMoveDown={() => moveEntry('experience', i, 1)}
                      onBulletChange={(bi, value) => updateBullet('experience', i, bi, value)}
                      onAddBullet={() => addBullet('experience', i)}
                      onRemoveBullet={(bi) => removeBullet('experience', i, bi)}
                    />
                  ))}

                  {form.education.length > 0 && (
                    <>
                      <SectionHeader title='Education' />
                      {form.education.map((entry, i) => (
                        <EducationEditor
                          key={i}
                          entry={entry}
                          onChange={(field, value) => updateEducationField(i, field, value)}
                        />
                      ))}
                    </>
                  )}

                  {form.leadership.length > 0 && (
                    <>
                      <SectionHeader title='Leadership' />
                      {form.leadership.map((entry, i) => (
                        <EntryEditor
                          key={i}
                          entry={entry}
                          index={i}
                          total={form.leadership.length}
                          onChange={(field, value) => updateEntryField('leadership', i, field, value)}
                          onMoveUp={() => moveEntry('leadership', i, -1)}
                          onMoveDown={() => moveEntry('leadership', i, 1)}
                          onBulletChange={(bi, value) => updateBullet('leadership', i, bi, value)}
                          onAddBullet={() => addBullet('leadership', i)}
                          onRemoveBullet={(bi) => removeBullet('leadership', i, bi)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className='px-4 py-3 border-t border-border shrink-0 flex flex-col gap-2'>
          <AnimatePresence>
            {showDiscardConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='overflow-hidden'
              >
                <div className='flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2 text-xs text-navy-muted'>
                  <span>Discard unsaved changes?</span>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setShowDiscardConfirm(false)}
                      className='font-medium text-navy hover:opacity-70 transition-opacity'
                    >
                      Keep editing
                    </button>
                    <button
                      onClick={onClose}
                      className='font-medium text-danger hover:opacity-70 transition-opacity'
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='flex gap-2 justify-end'>
            <Button variant='secondary' onClick={handleClose} className='text-xs px-3 py-1.5'>
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={handleSave}
              disabled={!form || updateCvData.isPending}
              className='text-xs px-3 py-1.5'
            >
              {updateCvData.isPending ? 'Saving...' : 'Save & Regenerate'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CVEditor
