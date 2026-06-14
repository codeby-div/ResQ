interface Props {
  label: string
  value: string
  variant?: "default" | "critical" | "warning" | "ok"
  trend?: number[]
  micro?: string
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, variant = "default", micro, icon }: Props) {
  const variantClass =
    variant === "critical" ? "card-critical" :
    variant === "warning" ? "card-warning" :
    variant === "ok" ? "card-ok" :
    "card"

  return (
    <div
      className={`${variantClass} transition-all duration-150 hover:shadow-sm animate-fade-in`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-section-label text-tertiary dark:text-tertiary-dark">
          {label}
        </span>
        {icon && (
          <span className="text-tertiary dark:text-tertiary-dark">{icon}</span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-metric-number tabular-nums text-primary dark:text-primary-dark">
          {value}
        </span>
      </div>
      {micro && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-metric-label text-secondary dark:text-secondary-dark">{micro}</span>
        </div>
      )}
    </div>
  )
}
