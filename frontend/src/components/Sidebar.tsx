import { NavLink } from "react-router-dom"

const sections = [
  {
    label: "Monitor",
    items: [
      { to: "/", label: "Live Map", icon: "map", count: 0 },
      { to: "/dashboard", label: "Dashboard", icon: "grid", count: 0 },
      { to: "/admin", label: "Admin Console", icon: "shield", count: 3 },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/hospital", label: "Hospital View", icon: "building", count: 0 },
      { to: "/ambulance", label: "Ambulance Ops", icon: "truck", count: 2 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/user", label: "User Portal", icon: "user", count: 0 },
    ],
  },
]

const icons: Record<string, React.ReactNode> = {
  map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16"/></svg>,
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="12" y1="6" x2="12" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /></svg>,
  truck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" /><rect x="16" y="8" width="6" height="8" rx="1" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
}

interface Props {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: Props) {
  return (
    <aside
      className={`
        ${collapsed ? "w-[48px] overflow-hidden" : "w-[220px]"}
        bg-surface2 dark:bg-surface2-dark border-r border-border dark:border-border-dark
        flex flex-col shrink-0 transition-all duration-150
        hidden lg:flex
      `}
    >
      <nav className="flex-1 py-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <p className="px-4 mb-2 text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-100
                  ${isActive
                    ? "border-l-2 border-primary dark:border-primary-dark text-primary dark:text-primary-dark font-medium"
                    : "border-l-2 border-transparent text-tertiary dark:text-tertiary-dark hover:bg-gray-100 dark:hover:bg-surface-dark hover:text-primary dark:hover:text-primary-dark"
                  }`
                }
              >
                <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                  {icons[item.icon]}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.count > 0 && (
                      <span className="text-xs text-tertiary dark:text-tertiary-dark">{item.count}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-border dark:border-border-dark flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-surface2-dark flex items-center justify-center text-xs font-medium">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary dark:text-primary-dark truncate">Admin User</p>
            <p className="text-[11px] text-tertiary dark:text-tertiary-dark truncate">Administrator</p>
          </div>
        </div>
      )}
    </aside>
  )
}
