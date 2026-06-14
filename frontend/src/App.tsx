import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import PatientPortal from "./pages/PatientPortal"
import AmbulancePortal from "./pages/AmbulancePortal"
import HospitalPortal from "./pages/HospitalPortal"
import AdminPortal from "./pages/AdminPortal"
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient" element={<PatientPortal />} />
        <Route path="/ambulance" element={<AmbulancePortal />} />
        <Route path="/hospital" element={<HospitalPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  )
}
