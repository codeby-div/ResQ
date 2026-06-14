export default function ResQLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M32,50 C32,50 6,33 6,20 C6,9 16,5 22,11 C27,16 30,22 32,27 C34,22 37,16 43,11 C49,5 59,9 59,20 C59,33 32,50 32,50 Z"
        fill="#E8253A"
        stroke="#1E2D6B"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M27,16 L37,16 L37,18 L35,18 L35,28 L29,28 L29,18 L27,18 Z"
        fill="white"
      />
      <path
        d="M22,21 L42,21 L42,25 L22,25 Z"
        fill="white"
      />
      <path
        d="M22,7 C16,6 4,8 4,22 C4,30 8,34 14,38"
        stroke="#1E2D6B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M42,7 C48,6 60,8 60,22 C60,30 56,34 50,38"
        stroke="#1E2D6B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14,38 L32,48"
        stroke="#1E2D6B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50,38 L32,48"
        stroke="#1E2D6B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line x1="22" y1="3" x2="22" y2="9" stroke="#1E2D6B" strokeWidth="4" strokeLinecap="round" />
      <line x1="42" y1="3" x2="42" y2="9" stroke="#1E2D6B" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M22,9 Q32,2 42,9"
        stroke="#1E2D6B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="20" y="1.5" width="3.5" height="5" rx="1.75" fill="#C8CDD4" stroke="#1E2D6B" strokeWidth="1.5" />
      <rect x="40.5" y="1.5" width="3.5" height="5" rx="1.75" fill="#C8CDD4" stroke="#1E2D6B" strokeWidth="1.5" />
      <circle cx="52" cy="48" r="7" fill="#C8CDD4" stroke="#1E2D6B" strokeWidth="3.5" />
    </svg>
  )
}
