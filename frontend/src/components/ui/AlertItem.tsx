interface Props {
  severity: "critical" | "warning" | "info"
  message: string
  timestamp: string
  unread?: boolean
  onClick?: () => void
}

export default function AlertItem({ severity, message, timestamp, unread, onClick }: Props) {
  const accentColor = severity === "critical" ? "bg-status-red" : severity === "warning" ? "bg-status-amber" : "bg-tertiary dark:bg-tertiary-dark"

  return (
    <div className={`flex gap-3 p-4 cursor-pointer transition-colors duration-150 hover:bg-surface2 dark:hover:bg-surface2-dark ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
      {unread && <span className="w-1.5 h-1.5 rounded-full bg-status-red shrink-0 mt-1.5" />}
      <div className={`w-0.5 shrink-0 rounded ${accentColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-body text-primary dark:text-primary-dark">{message}</p>
        <p className="text-caption text-tertiary dark:text-tertiary-dark mt-0.5">{timestamp}</p>
      </div>
    </div>
  )
}
