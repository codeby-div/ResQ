interface Step {
  key: string
  label: string
  timestamp?: string
}

interface Props {
  steps: Step[]
  currentKey: string
  onAdvance?: () => void
  advanceLabel?: string
}

export default function StatusTimeline({ steps, currentKey, onAdvance, advanceLabel = "Update Status" }: Props) {
  const currentIdx = steps.findIndex(s => s.key === currentKey)

  return (
    <div className="space-y-0 pb-3">
      {steps.map((step, i) => {
        const completed = i < currentIdx
        const current = i === currentIdx
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${
                completed ? "bg-accent dark:bg-primary-dark border-accent dark:border-primary-dark" :
                current ? "bg-status-green border-status-green" :
                "border-tertiary dark:border-tertiary-dark bg-transparent"
              }`}>
                {completed && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                {current && <span className="absolute w-5 h-5 rounded-full bg-status-green/20 animate-pulse-ring" />}
              </div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-border dark:border-border-dark min-h-[16px]" />}
            </div>
            <div className="pb-3 flex-1">
              <p className={`text-body ${current ? "font-medium text-primary dark:text-primary-dark" : completed ? "text-secondary dark:text-secondary-dark" : "text-tertiary dark:text-tertiary-dark"}`}>
                {step.label}
              </p>
              {step.timestamp && <p className="text-caption text-tertiary dark:text-tertiary-dark">{step.timestamp}</p>}
            </div>
          </div>
        )
      })}
      {onAdvance && (
        <button onClick={onAdvance}
          className="w-full h-[44px] rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-body font-medium hover:opacity-85 active:scale-[0.98] transition-all duration-150">
          {advanceLabel}
        </button>
      )}
    </div>
  )
}
