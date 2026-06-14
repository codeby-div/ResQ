import { useTheme } from "../context/ThemeContext"

const navMap: Record<string, string> = {
  "/": "Live Map",
  "/dashboard": "Dashboard",
  "/user": "User Portal",
  "/ambulance": "Ambulance Ops",
  "/hospital": "Hospital View",
  "/admin": "Admin Console",
}

interface Props {
  currentPath: string
  onToggleSidebar: () => void
}

export default function Header({ currentPath, onToggleSidebar }: Props) {
  const { theme, toggle } = useTheme()
  const pageName = navMap[currentPath] || "ResQ"

  return (
    <header className="h-[52px] bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1 text-secondary dark:text-secondary-dark hover:text-primary dark:hover:text-primary-dark transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="text-[15px] font-medium text-primary dark:text-primary-dark tracking-tight">ResQ</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 ml-4 text-xs text-secondary dark:text-secondary-dark">
          <span>ResQ</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-primary dark:text-primary-dark font-medium">{pageName}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-red animate-pulse-ring" />
            <span className="text-[11px] text-secondary dark:text-secondary-dark">3 Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-amber" />
            <span className="text-[11px] text-secondary dark:text-secondary-dark">5 High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-green" />
            <span className="text-[11px] text-secondary dark:text-secondary-dark">12 Available</span>
          </div>
        </div>

        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-secondary dark:text-secondary-dark hover:text-primary dark:hover:text-primary-dark hover:bg-gray-100 dark:hover:bg-surface2-dark transition-colors"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-surface2-dark flex items-center justify-center text-xs font-medium text-primary dark:text-primary-dark" aria-label="User avatar">
          AD
        </div>
      </div>
    </header>
  )
}
