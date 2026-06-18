import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ResQLogo from "../components/ui/ResQLogo"
import UserInfoForm from "../components/ui/UserInfoForm"
import AdminLoginForm from "../components/ui/AdminLoginForm"

const portals = [
  {
    key: "patient", label: "Patient", desc: "Report an emergency and track help in real time",
    accent: "#C0392B", bg: "rgba(192,57,43,0.08)", border: "rgba(192,57,43,0.18)",
    icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  },
  {
    key: "ambulance", label: "Ambulance", desc: "View dispatch assignments and update case status",
    accent: "#2D7A45", bg: "rgba(45,122,69,0.08)", border: "rgba(45,122,69,0.18)",
    icon: <g><rect x="1" y="3" width="15" height="13" rx="1" /><rect x="16" y="8" width="6" height="8" rx="1" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></g>,
  },
  {
    key: "hospital", label: "Hospital / Staff", desc: "Manage bed availability and incoming emergency cases",
    accent: "#1D6FA8", bg: "rgba(29,111,168,0.08)", border: "rgba(29,111,168,0.18)",
    icon: <g><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></g>,
  },
  {
    key: "admin", label: "Admin", desc: "City-wide overview, live map and resource analytics",
    accent: "#B7660A", bg: "rgba(183,102,10,0.08)", border: "rgba(183,102,10,0.18)",
    icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const handlePortalClick = (key: string) => {
    if (key === "admin") {
      setShowAdminLogin(true)
    } else {
      setSelectedPortal(key)
    }
  }

  const handleUserComplete = (data: Record<string, string | boolean>) => {
    sessionStorage.setItem("resq_user", JSON.stringify(data))
    navigate(`/${selectedPortal}`)
  }

  const handleAdminComplete = () => {
    navigate("/admin")
  }

  const handleBack = () => {
    setSelectedPortal(null)
    setShowAdminLogin(false)
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <ResQLogo size={72} />
          </div>
          <h1 className="text-[32px] font-semibold tracking-tight text-primary">ResQ</h1>
          <p className="text-sm text-secondary max-w-[340px] mx-auto mt-2 leading-relaxed">
            Real-time emergency resource allocation — connecting patients, ambulances and hospitals instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portals.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePortalClick(p.key)}
              className="rounded-xl p-[18px] text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] w-full"
              style={{ background: p.bg, border: `1px solid ${p.border}` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${p.accent}22` }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {p.icon}
                </svg>
              </div>
              <div className="text-sm font-medium text-primary">{p.label}</div>
              <div className="text-xs text-secondary mt-1 leading-relaxed">{p.desc}</div>
              <div className="flex items-center gap-1 mt-3.5 text-[11px] font-medium" style={{ color: p.accent }}>
                Enter portal
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-tertiary mt-8">ResQ Emergency System · Indore, MP</p>
      </div>

      {selectedPortal && (
        <UserInfoForm portal={selectedPortal} onComplete={handleUserComplete} onBack={handleBack} />
      )}

      {showAdminLogin && (
        <AdminLoginForm onComplete={handleAdminComplete} onBack={handleBack} />
      )}
    </div>
  )
}
