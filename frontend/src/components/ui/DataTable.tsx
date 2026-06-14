interface Props {
  label?: string
  search?: string
  onSearch?: (v: string) => void
  children: React.ReactNode
  emptyHeading?: string
  emptySubtext?: string
}

export default function DataTable({ label, search, onSearch, children, emptyHeading, emptySubtext }: Props) {
  return (
    <div className="card space-y-4">
      {(label || onSearch) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-section-label text-tertiary dark:text-tertiary-dark">{label}</span>}
          {onSearch && (
            <input value={search} onChange={e => onSearch(e.target.value)}
              className="w-48 border border-border dark:border-border-dark rounded px-3 py-1.5 text-caption bg-surface2 dark:bg-surface2-dark text-primary dark:text-primary-dark focus:border-secondary transition-colors"
              placeholder="Search..." />
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-caption">
          {children}
        </table>
        {emptyHeading && (
          <div className="py-8 text-center">
            <p className="text-caption text-tertiary dark:text-tertiary-dark">{emptyHeading}</p>
            {emptySubtext && <p className="text-metric-label text-secondary dark:text-secondary-dark mt-1">{emptySubtext}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
