import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ResQLogo from "../components/ui/ResQLogo"
import UserInfoForm from "../components/ui/UserInfoForm"
import AdminLoginForm from "../components/ui/AdminLoginForm"
import type { AdminCredentials } from "../components/ui/AdminLoginForm"

const portals = [
  { key: "patient", label: "Patient", desc: "Report emergency & track ambulance" },
  { key: "ambulance", label: "Ambulance", desc: "Driver dashboard & navigation" },
  { key: "hospital", label: "Hospital / Staff", desc: "Manage emergencies, beds & ward" },
  { key: "admin", label: "Admin", desc: "System overview, live map & reports" },
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

  const handleAdminComplete = (data: AdminCredentials) => {
    sessionStorage.setItem("resq_admin", JSON.stringify(data))
    navigate("/admin")
  }

  const handleBack = () => {
    setSelectedPortal(null)
    setShowAdminLogin(false)
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <ResQLogo size={64} />
          </div>
          <h1 className="text-[32px] font-bold text-[#F0F1F3] tracking-tight">ResQ</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portals.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePortalClick(p.key)}
              className="bg-[#1A1D27] border border-[#22263A] rounded-xl p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[#2E3348] hover:shadow-lg active:scale-[0.98]"
            >
              <h2 className="text-body font-medium text-[#F0F1F3]">{p.label}</h2>
              <p className="text-caption text-[#5C6278] mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
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
