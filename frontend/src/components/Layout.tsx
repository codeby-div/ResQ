import { useState } from "react"
import Header from "./Header"
import Sidebar from "./Sidebar"

interface Props {
  children: React.ReactNode
  currentPath: string
}

export default function Layout({ children, currentPath }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      <Header currentPath={currentPath} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0F1117]">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
