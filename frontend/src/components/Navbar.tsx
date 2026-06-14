import { Link, useLocation } from "react-router-dom"

const roles = [
  { to: "/", label: "Map", role: "public" },
  { to: "/user", label: "User", role: "patient" },
  { to: "/ambulance", label: "Ambulance", role: "driver" },
  { to: "/hospital", label: "Hospital", role: "staff" },
  { to: "/admin", label: "Admin", role: "admin" },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <Link to="/" className="text-xl font-bold tracking-tight">
        ResQ
      </Link>
      <div className="flex gap-1">
        {roles.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              location.pathname === link.to
                ? "bg-white/20 font-semibold"
                : "text-red-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
