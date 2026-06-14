import { useState } from "react"

interface Props {
  portal: string
  onComplete: (data: UserInfo) => void
  onBack: () => void
}

export interface UserInfo {
  name: string
  age: string
  phone: string
  location: string
  micGranted: boolean
}

export default function UserInfoForm({ portal, onComplete, onBack }: Props) {
  const [data, setData] = useState<UserInfo>({ name: "", age: "", phone: "", location: "", micGranted: false })
  const [micRequested, setMicRequested] = useState(false)

  const handleMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setData(p => ({ ...p, micGranted: true }))
    } catch {
      setData(p => ({ ...p, micGranted: false }))
    }
    setMicRequested(true)
  }

  const valid = data.name.trim() && data.age.trim() && data.phone.trim() && data.location.trim()

  return (
    <div className="fixed inset-0 bg-[#0F1117]/95 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-[#1A1D27] rounded-xl border border-[#22263A] p-6 space-y-5">
        <h2 className="text-[15px] font-medium text-[#F0F1F3]">Enter your details</h2>
        <p className="text-[11px] text-[#5C6278]">Accessing <span className="text-[#F0F1F3]">{portal}</span> portal</p>

        {(["name", "age", "phone", "location"] as const).map(f => (
          <div key={f}>
            <label className="text-[11px] uppercase tracking-wider text-[#5C6278] mb-1 block">{f}</label>
            <input
              value={(data as any)[f]}
              onChange={e => setData(p => ({ ...p, [f]: e.target.value }))}
              className="w-full bg-[#0F1117] border border-[#22263A] rounded-lg px-3 py-2 text-[13px] text-[#F0F1F3] placeholder-[#5C6278] outline-none focus:border-[#2E3348]"
              placeholder={`Enter ${f}`}
            />
          </div>
        ))}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#5C6278]">Microphone access</span>
          <button
            onClick={handleMic}
            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${data.micGranted ? "bg-green-900/30 border-green-700 text-green-300" : "bg-[#0F1117] border-[#22263A] text-[#5C6278]"}`}
          >
            {data.micGranted ? "Granted" : micRequested ? "Denied" : "Allow"}
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 text-[13px] text-[#5C6278] py-2 rounded-lg border border-[#22263A] hover:text-[#F0F1F3] transition-colors">Back</button>
          <button
            onClick={() => valid && onComplete(data)}
            disabled={!valid}
            className="flex-1 text-[13px] font-medium text-white bg-[#C0392B] py-2 rounded-lg disabled:opacity-40 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
