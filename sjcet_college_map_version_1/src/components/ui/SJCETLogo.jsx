import React from "react"

export function SJCETLogo({ height = 42 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {/* Official SJCET Cogwheel & Flame Emblem SVG */}
      <svg
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
      >
        {/* Outer Cogwheel Ring */}
        <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#dc2626" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="44" stroke="#dc2626" strokeWidth="1" strokeDasharray="4 2" />
        
        {/* Cog Teeth Accent */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16
          return (
            <rect
              key={i}
              x="47.5"
              y="0.5"
              width="5"
              height="5"
              fill="#cbd5e1"
              transform={`rotate(${angle} 50 50)`}
              rx="1"
            />
          )
        })}

        {/* Circular Banner Ring with Red Text */}
        <circle cx="50" cy="50" r="38" fill="white" stroke="#dc2626" strokeWidth="1.5" />
        
        {/* Inner Green Globe */}
        <circle cx="50" cy="42" r="22" fill="#16a34a" />
        <ellipse cx="50" cy="42" rx="22" ry="8" stroke="#ffffff" strokeWidth="1.5" fill="none" />
        <ellipse cx="50" cy="42" rx="14" ry="22" stroke="#ffffff" strokeWidth="1.5" fill="none" />
        <line x1="50" y1="20" x2="50" y2="64" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="28" y1="42" x2="72" y2="42" stroke="#ffffff" strokeWidth="1.5" />

        {/* Yellow Orbit Ring around Globe */}
        <ellipse cx="50" cy="42" rx="26" ry="6" stroke="#eab308" strokeWidth="2" fill="none" transform="rotate(-12 50 42)" />

        {/* Golden Lamp & Red Flame at Base */}
        <path d="M36 68 C36 60, 64 60, 64 68 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
        <path d="M50 48 Q44 60 50 64 Q56 60 50 48 Z" fill="#dc2626" />
        <path d="M50 52 Q47 59 50 62 Q53 59 50 52 Z" fill="#f97316" />
      </svg>

      {/* Vertical Divider Line */}
      <div style={{ width: "1px", height: `${height * 0.85}px`, backgroundColor: "#cbd5e1" }} />

      {/* Official SJCET Typography Stack */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "15px",
            color: "var(--navy-900)",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          ST. JOSEPH'S
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "9px",
            color: "var(--navy-700)",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          College of Engineering and Technology
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#64748b",
              letterSpacing: "0.1em",
            }}
          >
            - PALAI -
          </span>
          <span
            style={{
              fontSize: "8.5px",
              fontWeight: 800,
              color: "var(--navy-900)",
              letterSpacing: "0.08em",
              borderBottom: "1.5px solid var(--navy-900)",
              lineHeight: 1,
            }}
          >
            AUTONOMOUS
          </span>
        </div>
      </div>
    </div>
  )
}
