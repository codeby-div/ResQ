import { useNavigate, useLocation } from "react-router-dom"

export default function BackToHome() {
  const navigate = useNavigate()
  const location = useLocation()
  if (location.pathname === "/") return null
  return (
    <button
      onClick={() => navigate("/")}
      className="fixed top-3 left-3 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-surface1-dark border border-border dark:border-border-dark text-secondary hover:text-primary shadow-sm transition-colors text-sm"
      title="Back to role selection"
      aria-label="Back to role selection"
    >
      &larr;
    </button>
  )
}
