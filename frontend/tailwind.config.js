/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": ["22px", { fontWeight: "500" }],
        "section-label": ["11px", { fontWeight: "500", letterSpacing: "0.08em" }],
        "metric-number": ["36px", { fontWeight: "300" }],
        "metric-label": ["12px", { fontWeight: "400" }],
        "body": ["13px", { lineHeight: "1.6" }],
        "caption": ["11px", { fontWeight: "400" }],
        "micro": ["10px", { fontWeight: "500" }],
      },
      colors: {
        page: "#F5F4F2",
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1A1D27",
        },
        surface2: {
          DEFAULT: "#F0EFED",
          dark: "#22263A",
        },
        border: {
          DEFAULT: "#E2E0DC",
          dark: "#2E3348",
        },
        primary: {
          DEFAULT: "#1A1917",
          dark: "#F0F1F3",
        },
        secondary: {
          DEFAULT: "#6B6966",
          dark: "#9EA3B5",
        },
        tertiary: {
          DEFAULT: "#9E9B97",
          dark: "#5C6278",
        },
        accent: "#1A1917",
        status: {
          red: "#C0392B",
          amber: "#B7660A",
          green: "#2D7A45",
        },
        hospital: "#1D6FA8",
        ambulance: "#2D7A45",
      },
      spacing: {
        "card": "24px",
        "card-gap": "16px",
        "section": "32px",
      },
      borderRadius: {
        card: "8px",
      },
      borderWidth: {
        card: "1px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
}
