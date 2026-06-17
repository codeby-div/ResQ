import { useState, useEffect } from "react"

export interface ToastData {
  id: string
  title: string
  body: string
  type: "emergency" | "dispatch" | "status" | "info"
}

let toastListeners: ((toast: ToastData) => void)[] = []

export function showToast(toast: ToastData) {
  toastListeners.forEach(fn => fn(toast))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<(ToastData & { leaving?: boolean })[]>([])

  useEffect(() => {
    const handler = (toast: ToastData) => {
      const id = toast.id + Date.now()
      setToasts(prev => [...prev, { ...toast, id }])
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id))
        }, 300)
      }, 5000)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`rounded-lg border p-4 shadow-lg transition-all duration-300 ${
            t.leaving ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
          } ${
            t.type === "emergency"
              ? "bg-status-red/10 border-status-red text-status-red"
              : t.type === "dispatch"
              ? "bg-status-amber/10 border-status-amber text-status-amber"
              : t.type === "status"
              ? "bg-status-green/10 border-status-green text-status-green"
              : "bg-surface2 dark:bg-surface2-dark border-border text-primary"
          }`}
        >
          <p className="text-[13px] font-medium">{t.title}</p>
          <p className="text-[12px] opacity-80 mt-0.5">{t.body}</p>
        </div>
      ))}
    </div>
  )
}
