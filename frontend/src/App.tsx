import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import PatientPortal from "./pages/PatientPortal"
import AmbulancePortal from "./pages/AmbulancePortal"
import HospitalPortal from "./pages/HospitalPortal"
import AdminPortal from "./pages/AdminPortal"
import BackToHome from "./components/ui/BackToHome"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient" element={<><BackToHome /><PatientPortal /></>} />
        <Route path="/ambulance" element={<><BackToHome /><AmbulancePortal /></>} />
        <Route path="/hospital" element={<><BackToHome /><HospitalPortal /></>} />
        <Route path="/admin" element={<><BackToHome /><AdminPortal /></>} />
      </Routes>
    </BrowserRouter>
  )
}
