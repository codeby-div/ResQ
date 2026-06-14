import { useState } from "react"
import { useAuth } from "../../context/AuthContext"

interface Props {
  onComplete: (user: any) => void
  onBack: () => void
}

export default function AdminLoginForm({ onComplete, onBack }: Props) {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const user = await login(username, password)
      onComplete(user)
    } catch {
      setError("Invalid credentials")
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-[#0F1117]/95 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-[#1A1D27] rounded-xl border border-[#22263A] p-6 space-y-5">
        <h2 className="text-[15px] font-medium text-[#F0F1F3]">Admin Access</h2>
        <p className="text-[11px] text-[#5C6278]">Authorized personnel only</p>

        {error && <p className="text-[11px] text-status-red bg-red-900/20 rounded px-3 py-2">{error}</p>}

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#5C6278] mb-1 block">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            className="w-full bg-[#0F1117] border border-[#22263A] rounded-lg px-3 py-2 text-[13px] text-[#F0F1F3] placeholder-[#5C6278] outline-none focus:border-[#2E3348]"
            placeholder="Enter username" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#5C6278] mb-1 block">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0F1117] border border-[#22263A] rounded-lg px-3 py-2 text-[13px] text-[#F0F1F3] placeholder-[#5C6278] outline-none focus:border-[#2E3348]"
            placeholder="Enter password" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 text-[13px] text-[#5C6278] py-2 rounded-lg border border-[#22263A] hover:text-[#F0F1F3] transition-colors">Back</button>
          <button onClick={handleSubmit} disabled={submitting || !username.trim() || !password.trim()}
            className="flex-1 text-[13px] font-medium text-white bg-[#C0392B] py-2 rounded-lg disabled:opacity-40 transition-opacity">
            {submitting ? "Logging in..." : "Enter Admin"}
          </button>
        </div>
      </div>
    </div>
  )
}
