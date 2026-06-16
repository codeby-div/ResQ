export interface Hospital {
  id: number
  name: string
  latitude: number
  longitude: number
  total_beds: number
  available_beds: number
  total_icu: number
  available_icu: number
  status: "active" | "full" | "closed"
}

export interface Ambulance {
  id: number
  vehicle_id: string
  latitude: number
  longitude: number
  status: "available" | "en_route" | "busy"
  hospital_id: number | null
}

export interface Emergency {
  id: number
  patient_name: string
  severity: "low" | "medium" | "high" | "critical"
  description: string | null
  latitude: number
  longitude: number
  status: "pending" | "dispatched" | "resolved"
  created_at: string
  assigned_ambulance_id: number | null
  assigned_hospital_id: number | null
}

export interface Recommendation {
  recommended_hospitals: {
    id: number
    name: string
    latitude: number
    longitude: number
    distance_km: number
    available_beds: number
    available_icu: number
    score: number
  }[]
  recommended_ambulances: {
    id: number
    vehicle_id: string
    latitude: number
    longitude: number
    distance_km: number
  }[]
  estimated_response_time: number | null
}

export interface EmergencyFormData {
  patient_name: string
  description: string
  latitude: number
  longitude: number
  severity: "low" | "medium" | "high" | "critical"
  phone?: string
  email?: string
}

export interface Hotspot {
  latitude: number
  longitude: number
  frequency: number
}

export interface Summary {
  total: number
  pending: number
  dispatched: number
  resolved: number
  critical: number
  high: number
}

export interface TrackingInfo {
  ambulance_lat: number | null
  ambulance_lng: number | null
  ambulance_vehicle_id: string | null
  status: "pending" | "dispatched" | "resolved"
  eta_seconds: number | null
  progress_pct: number
  route: { lat: number; lng: number }[]
  emergency_lat: number
  emergency_lng: number
}

export interface NotificationItem {
  id: number
  user_id: number | null
  emergency_id: number | null
  title: string
  body: string
  type: string
  channel: string
  read: number
  created_at: string
}
