import type { Hospital, Ambulance } from "../types"

export const demoHospitals: Hospital[] = [
  { id: 1, name: "AIIMS Delhi", latitude: 28.5672, longitude: 77.2100, total_beds: 250, available_beds: 18, total_icu: 40, available_icu: 3, status: "active" },
  { id: 2, name: "Fortis Mumbai", latitude: 19.0760, longitude: 72.8777, total_beds: 180, available_beds: 12, total_icu: 25, available_icu: 2, status: "active" },
  { id: 3, name: "Apollo Chennai", latitude: 13.0827, longitude: 80.2707, total_beds: 200, available_beds: 9, total_icu: 30, available_icu: 1, status: "active" },
  { id: 4, name: "Narayana Bangalore", latitude: 12.9716, longitude: 77.5946, total_beds: 160, available_beds: 22, total_icu: 20, available_icu: 4, status: "active" },
  { id: 5, name: "CMC Vellore", latitude: 12.9200, longitude: 79.1500, total_beds: 300, available_beds: 5, total_icu: 35, available_icu: 0, status: "full" },
  { id: 6, name: "KEM Hospital Pune", latitude: 18.5204, longitude: 73.8567, total_beds: 140, available_beds: 14, total_icu: 18, available_icu: 2, status: "active" },
  { id: 7, name: "Medanta Gurgaon", latitude: 28.4744, longitude: 77.0386, total_beds: 220, available_beds: 7, total_icu: 28, available_icu: 0, status: "full" },
  { id: 8, name: "Tata Memorial Kolkata", latitude: 22.5726, longitude: 88.3639, total_beds: 190, available_beds: 11, total_icu: 22, available_icu: 1, status: "active" },
]

export const demoAmbulances: Ambulance[] = [
  { id: 1, vehicle_id: "AMB-001", latitude: 28.5800, longitude: 77.2200, status: "available", hospital_id: 1 },
  { id: 2, vehicle_id: "AMB-002", latitude: 28.5500, longitude: 77.2000, status: "en_route", hospital_id: 1 },
  { id: 3, vehicle_id: "AMB-003", latitude: 19.0900, longitude: 72.8900, status: "available", hospital_id: 2 },
  { id: 4, vehicle_id: "AMB-004", latitude: 19.0600, longitude: 72.8600, status: "busy", hospital_id: 2 },
  { id: 5, vehicle_id: "AMB-005", latitude: 13.1000, longitude: 80.2800, status: "available", hospital_id: 3 },
  { id: 6, vehicle_id: "AMB-006", latitude: 12.9600, longitude: 77.5800, status: "available", hospital_id: 4 },
  { id: 7, vehicle_id: "AMB-007", latitude: 18.5300, longitude: 73.8700, status: "en_route", hospital_id: 6 },
]
