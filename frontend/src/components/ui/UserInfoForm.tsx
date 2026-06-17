import { useState } from "react"

interface Props {
  portal: string
  onComplete: (data: Record<string, string | boolean>) => void
  onBack: () => void
}

type Field = { key: string; label: string; type?: "text" | "location" | "mic" }

const portalFields: Record<string, Field[]> = {
  patient: [
    { key: "name", label: "Name" },
    { key: "age", label: "Age" },
    { key: "phone", label: "Phone number" },
    { key: "location", label: "Location", type: "location" },
    { key: "mic", label: "Microphone access", type: "mic" },
  ],
  ambulance: [
    { key: "name", label: "Name" },
    { key: "vehicleNo", label: "Vehicle no" },
    { key: "age", label: "Age" },
    { key: "location", label: "Location access", type: "location" },
    { key: "mic", label: "Microphone access", type: "mic" },
  ],
  hospital: [
    { key: "name", label: "Name" },
    { key: "staffId", label: "Staff ID" },
    { key: "hospitalName", label: "Hospital name" },
    { key: "regNo", label: "Hospital registration number" },
    { key: "mic", label: "Microphone access", type: "mic" },
    { key: "location", label: "Location access", type: "location" },
  ],
}


export default function UserInfoForm({ portal, onComplete, onBack }: Props) {
  const fields = portalFields[portal] || portalFields.patient
  const initial: Record<string, string | boolean> = {}
  fields.forEach(f => { initial[f.key] = f.type === "mic" || f.type === "location" ? false : "" })
  const [data, setData] = useState<Record<string, string | boolean>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: string, val: string | boolean) => {
    setData(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: "" }))
  }

  const handlePermission = async (type: string) => {
    if (type === "mic") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
        set("mic", true)
      } catch { set("mic", false) }
    } else {
      try {
        await new Promise<void>((res, rej) => navigator.geolocation.getCurrentPosition(() => res(), () => rej()))
        set("location", true)
      } catch { set("location", false) }
    }
  }

  const isValidAmbulanceAge = (v: string) => {
    const n = Number(v)
    return v.trim() !== "" && !isNaN(n) && n > 20
  }

  const handleContinue = async () => {
    if (portal === "ambulance") {
      const errs: Record<string, string> = {}

      if (!data.name?.toString().trim()) errs.name = "Required"

      if (!data.age || !isValidAmbulanceAge(String(data.age))) {
        errs.age = "Age must be greater than 20"
      }

      setErrors(errs)
      if (Object.keys(errs).length === 0) onComplete(data)
    } else {
      onComplete(data)
    }
  }

  const basicValid = fields.filter(f => f.type !== "mic" && f.type !== "location").every(f => String(data[f.key] || "").trim())

  return (
    <div className="fixed inset-0 bg-[#0F1117]/95 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-[#1A1D27] rounded-xl border border-[#22263A] p-6 space-y-5">
        <h2 className="text-[15px] font-medium text-[#F0F1F3]">Enter your details</h2>
        <p className="text-[11px] text-[#5C6278]">Accessing <span className="text-[#F0F1F3]">{portal}</span> portal</p>

        {fields.map(f => {
          if (f.type === "mic" || f.type === "location") {
            const granted = data[f.key]
            return (
              <div key={f.key} className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#5C6278]">{f.label}</span>
                <button onClick={() => handlePermission(f.type!)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${granted ? "bg-green-900/30 border-green-700 text-green-300" : "bg-[#0F1117] border-[#22263A] text-[#5C6278]"}`}>
                  {granted ? "Granted" : "Allow"}
                </button>
              </div>
            )
          }
          return (
            <div key={f.key}>
              <label className="text-[11px] uppercase tracking-wider text-[#5C6278] mb-1 block">{f.label}</label>
              <input value={String(data[f.key] || "")}
                onChange={e => set(f.key, e.target.value)}
                className={`w-full bg-[#0F1117] border ${errors[f.key] ? "border-status-red" : "border-[#22263A]"} rounded-lg px-3 py-2 text-[13px] text-[#F0F1F3] placeholder-[#5C6278] outline-none focus:border-[#2E3348]`}
                placeholder={`Enter ${f.label.toLowerCase()}`} />
              {errors[f.key] && <p className="text-[10px] text-status-red mt-1">{errors[f.key]}</p>}
            </div>
          )
        })}

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="flex-1 text-[13px] text-[#5C6278] py-2 rounded-lg border border-[#22263A] hover:text-[#F0F1F3] transition-colors">Back</button>
          <button onClick={handleContinue} disabled={!basicValid}
            className="flex-1 text-[13px] font-medium text-white bg-[#C0392B] py-2 rounded-lg disabled:opacity-40 transition-opacity">
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
