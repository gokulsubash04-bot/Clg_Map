import React, { useState } from "react"
import MapView from "../MapView"
import { Box, X, Navigation, MapPin, Layers } from "lucide-react"

export function HomeView({ onSelect3D }) {
  const [showWelcomeCard, setShowWelcomeCard] = useState(true)
  const [mapLayer, setMapLayer] = useState("Street") // 'Street' | 'Satellite'

  return (
    <div className="home-map-wrapper">
      {/* 2D Leaflet Map */}
      <MapView onSelect3D={onSelect3D} initialBaseLayer={mapLayer} />

      {/* RIGHT SIDE WELCOME CARD (Kept as before) */}
      {showWelcomeCard ? (
        <div className="home-overlay-card right-side-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div>
              <h2 className="welcome-title" style={{ fontSize: "17px", margin: 0 }}>
                Welcome to SJCET
              </h2>
              <p className="welcome-text" style={{ fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>
                St. Joseph's College of Engineering and Technology, Palai.
              </p>
            </div>

            <button
              onClick={() => setShowWelcomeCard(false)}
              className="card-close-btn"
              title="Close welcome note"
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "8px 10px", background: "var(--blue-50)", border: "1px solid var(--blue-100)", borderRadius: "var(--radius-md)", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={15} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--blue-700)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Starting Location
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--navy-900)" }}>
                  Live GPS Data (Auto-detected)
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
            Explore campus buildings, classrooms, and facilities. Navigation automatically uses your live GPS location.
          </p>

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => onSelect3D("ALL")}
          >
            <Box size={16} />
            <span>View 3D Campus Model</span>
          </button>
        </div>
      ) : (
        /* Re-open floating trigger if closed */
        <button
          className="reopen-panel-btn"
          onClick={() => setShowWelcomeCard(true)}
          title="Open welcome note"
        >
          <Navigation size={16} />
          <span>Campus Info</span>
        </button>
      )}
    </div>
  )
}
