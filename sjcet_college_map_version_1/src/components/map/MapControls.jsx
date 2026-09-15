import { useEffect } from "react"
import { useMap } from "react-leaflet"

export function MapControls({ userLocation, follow, setFollow }) {
  const map = useMap()

  useEffect(() => {
    if (follow && userLocation) {
      const maxAllowed = map.getMaxZoom() || 18
      const targetZoom = Math.min(Math.max(map.getZoom(), 18), maxAllowed)
      map.flyTo(userLocation, targetZoom, { animate: true, duration: 0.8 })
    }
  }, [follow, userLocation, map])

  const btn = {
    width: 40,
    height: 40,
    borderRadius: 2,
    border: "1px solid #dadce0",
    background: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
    cursor: "pointer",
    color: "#5f6368",
    fontSize: 16,
    lineHeight: "40px",
    textAlign: "center",
  }

  return (
    <div className="gm-map-controls" style={{ position: "absolute", right: 12, bottom: 72, zIndex: 1200, display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        aria-label="Recenter to my location"
        onClick={() => {
          if (userLocation) {
            const maxAllowed = map.getMaxZoom() || 18
            const targetZoom = Math.min(18, maxAllowed)
            map.flyTo(userLocation, targetZoom, { animate: true, duration: 0.8 })
          }
        }}
        title="Recenter"
        className="gm-map-control-btn"
        style={btn}
      >

        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M11 2h2v3.07A7.002 7.002 0 0 1 18.93 11H22v2h-3.07A7.002 7.002 0 0 1 13 18.93V22h-2v-3.07A7.002 7.002 0 0 1 5.07 13H2v-2h3.07A7.002 7.002 0 0 1 11 5.07V2zm1 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
        </svg>
      </button>
      <button
        aria-label={follow ? "Disable follow mode" : "Enable follow mode"}
        onClick={() => setFollow((v) => !v)}
        title="Follow me"
        className="gm-map-control-btn"
        style={{ ...btn, background: "white", color: follow ? "#1a73e8" : "#5f6368", fontWeight: 700 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2l4 8h-3v7h-2v-7H8l4-8zm-7 17h14v2H5v-2z"/>
        </svg>
      </button>
    </div>
  )
}