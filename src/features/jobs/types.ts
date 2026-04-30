export interface JobListProps {
  jobs: import('@/shared/types').Job[]
  onDelete: (id: string) => void
  onGenerate: (id: string) => void
  onClearAll: () => void
}
