import { Plus, Briefcase } from 'lucide-react'

interface Props {
  onAddJob: () => void
}

export default function EmptyState({ onAddJob }: Props) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-5 px-6 py-10 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shadow-brand">
          <Briefcase size={26} className="text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-salmon border-2 border-white flex items-center justify-center shadow-sm">
          <Plus size={12} className="text-lightblue" />
        </div>
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-darkblue">No jobs yet</p>
        <p className="text-xs text-darkblue/40 max-w-52 leading-relaxed">
          Paste a job description to get a tailored CV highlight for your first application.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onAddJob}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-brand-sm hover:shadow-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200 cursor-pointer"
      >
        <Plus size={14} />
        Add your first job
      </button>
    </div>
  )
}
