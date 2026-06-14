interface Props {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmationModal({ title, description, onConfirm, onCancel, confirmLabel = "Confirm", cancelLabel = "Cancel" }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-card w-full max-w-sm p-6 animate-fade-in space-y-4">
        <h3 className="text-body font-medium text-primary dark:text-primary-dark">{title}</h3>
        <p className="text-caption text-secondary dark:text-secondary-dark">{description}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 text-caption rounded border border-border dark:border-border-dark text-secondary dark:text-secondary-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-all duration-150">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-caption rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] hover:opacity-85 active:scale-[0.98] transition-all duration-150">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
