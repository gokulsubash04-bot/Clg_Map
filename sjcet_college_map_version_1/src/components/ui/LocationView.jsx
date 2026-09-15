import React, { useMemo } from "react"
import { MapPin, Navigation, Signal, Crosshair, ShieldCheck } from "lucide-react"
import { useGPS } from "../../hooks/useGPS"
import { findNearestGpsNode, getCleanGpsStatus } from "../../lib/gpsNodeAdapter"
import { nodes } from "../../data/campusData"

export function LocationView({ onCenterOnMap }) {
  const { userLocation, gpsAccuracy, gpsStatus } = useGPS()

  const statusInfo = getCleanGpsStatus(gpsStatus, gpsAccuracy)

  const detectedNodeInfo = useMemo(() => {
    if (!userLocation) return null
    return findNearestGpsNode(userLocation, nodes)
  }, [userLocation])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Live Location</h1>
        <p className="page-description">
          Monitor your real-time campus GPS positioning and accuracy status.
        </p>
      </div>

      <div className="location-dashboard">
        <div className="location-status-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="brand-icon" style={{ backgroundColor: "var(--blue-50)", color: "var(--blue-600)" }}>
                <MapPin size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--navy-900)" }}>
                  Your Current Position
                </h3>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  SJCET Campus GPS Feed
                </span>
              </div>
            </div>

            <div className={`gps-status-chip ${statusInfo.state}`}>
              <span className="gps-dot" />
              <span>{statusInfo.text}</span>
            </div>
          </div>

          <div className="status-grid">
            <div className="stat-box">
              <div className="stat-label">GPS Accuracy</div>
              <div className="stat-value">
                {gpsAccuracy ? `±${Math.round(gpsAccuracy)} meters` : "Detecting..."}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Nearest Building</div>
              <div className="stat-value">
                {detectedNodeInfo?.node ? detectedNodeInfo.node.name : "Analyzing location..."}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Latitude</div>
              <div className="stat-value" style={{ fontSize: "14px", fontFamily: "monospace" }}>
                {userLocation ? userLocation[0].toFixed(6) : "—"}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Longitude</div>
              <div className="stat-value" style={{ fontSize: "14px", fontFamily: "monospace" }}>
                {userLocation ? userLocation[1].toFixed(6) : "—"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
            <button className="btn-primary" onClick={onCenterOnMap}>
              <Crosshair size={16} />
              <span>Center on Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
