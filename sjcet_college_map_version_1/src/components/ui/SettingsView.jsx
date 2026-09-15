import React from "react"
import { Settings, Info, Map, Gauge, Layers } from "lucide-react"

export function SettingsView() {
  return (
    <div className="page-container" style={{ maxWidth: "800px" }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Customize navigation preferences, map display, and system parameters.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="location-status-card">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Map size={18} style={{ color: "var(--blue-600)" }} />
            Display & Navigation Preferences
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Distance Units</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Choose metric or imperial units</div>
              </div>
              <select className="select-input" style={{ width: "120px" }}>
                <option value="m">Meters (m)</option>
                <option value="ft">Feet (ft)</option>
              </select>
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--border-color)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Default Map Layer</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Base tile layer for campus map</div>
              </div>
              <select className="select-input" style={{ width: "140px" }}>
                <option value="street">Street Map</option>
                <option value="satellite">Satellite Imagery</option>
              </select>
            </div>
          </div>
        </div>

        <div className="location-status-card">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Gauge size={18} style={{ color: "var(--blue-600)" }} />
            GPS Positioning Engine
          </h3>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Kalman Filter Smoothing</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Reduces GPS jitter on campus paths</div>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--status-success-fg)", backgroundColor: "var(--status-success-bg)", padding: "4px 10px", borderRadius: "var(--radius-full)" }}>
              Enabled
            </span>
          </div>
        </div>

        <div className="location-status-card">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Info size={18} style={{ color: "var(--blue-600)" }} />
            About SJCET Campus Navigator
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            St. Joseph's College of Engineering and Technology (SJCET), Palai.
            <br />
            Campus Navigation System featuring 2D Leaflet spatial maps, Three.js 3D building inspection, indoor room directory, Dijkstra pathfinding, and live GPS tracking.
          </p>
        </div>
      </div>
    </div>
  )
}
