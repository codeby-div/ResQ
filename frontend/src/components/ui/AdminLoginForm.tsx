import { useState } from "react"

interface Props {
  onComplete: (data: AdminCredentials) => void
  onBack: () => void
}

export interface AdminCredentials {
  userId: string
  username: string
  position: string
}

export default function AdminLoginForm({ onComplete, onBack }: Props) {
  const [data, setData] = useState<AdminCredentials>({ userId: "", username: "", position: "" })

  const valid = data.userId.trim() && data.username.trim() && data.position.trim()

  return (
    <div className="fixed inset-0 bg-[#0F1117]/95 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-[#1A1D27] rounded-xl border border-[#22263A] p-6 space-y-5">
        <h2 className="text-[15px] font-medium text-[#F0F1F3]">Admin Access</h2>
        <p className="text-[11px] text-[#5C6278]">Authorized personnel only</p>

        {[["userId", "User ID"], ["username", "Username"], ["position", "Position of work"]].map(([key, label]) => (
          <div key={key}>
            <label className="text-[11px] uppercase tracking-wider text-[#5C6278] mb-1 block">{label}</label>
            <input
              value={(data as any)[key]}
              onChange={e => setData(p => ({ ...p, [key]: e.target.value }))}
              className="w-full bg-[#0F1117] border border-[#22263A] rounded-lg px-3 py-2 text-[13px] text-[#F0F1F3] placeholder-[#5C6278] outline-none focus:border-[#2E3348]"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 text-[13px] text-[#5C6278] py-2 rounded-lg border border-[#22263A] hover:text-[#F0F1F3] transition-colors">Back</button>
          <button
            onClick={() => valid && onComplete(data)}
            disabled={!valid}
            className="flex-1 text-[13px] font-medium text-white bg-[#C0392B] py-2 rounded-lg disabled:opacity-40 transition-opacity"
          >
            Enter Admin
          </button>
        </div>
      </div>
    </div>
  )
}
