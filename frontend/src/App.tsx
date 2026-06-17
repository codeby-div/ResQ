import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import PatientPortal from "./pages/PatientPortal"
import AmbulancePortal from "./pages/AmbulancePortal"
import HospitalPortal from "./pages/HospitalPortal"
import AdminPortal from "./pages/AdminPortal"
import MapPage from "./pages/MapPage"
import ToastContainer from "./components/Toast"
import { initNotificationListeners } from "./services/notifications"

export default function App() {
  useEffect(() => {
    initNotificationListeners()
  }, [])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient" element={<PatientPortal />} />
        <Route path="/ambulance" element={<AmbulancePortal />} />
        <Route path="/hospital" element={<HospitalPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  )
}
