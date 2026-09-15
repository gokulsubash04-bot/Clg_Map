import React from "react"
import { Map, Box } from "lucide-react"
import { SJCETHeaderLogo } from "./SJCETHeaderLogo"
import { GPSStatusChip } from "./GPSStatusChip"

export function Header({
  activeTab,
  onNavigate,
  gpsStatus,
  gpsAccuracy,
}) {
  return (
    <header className="app-header">
      {/* Sleek Slim Logo */}
      <div className="header-title-area">
        <SJCETHeaderLogo height={42} />
      </div>

      {/* Center View Switcher Tabs */}
      <div className="header-tab-switcher">
        <button
          className={`tab-switch-btn ${activeTab !== "3d" ? "active" : ""}`}
          onClick={() => onNavigate("map")}
        >
          <Map size={16} />
          <span>Campus Map</span>
        </button>

        <button
          className={`tab-switch-btn ${activeTab === "3d" ? "active" : ""}`}
          onClick={() => onNavigate("3d")}
        >
          <Box size={16} />
          <span>3D Building Model</span>
        </button>
      </div>

      {/* Right Action / GPS Status */}
      <div className="header-actions">
        <GPSStatusChip gpsStatus={gpsStatus} accuracy={gpsAccuracy} />
      </div>
    </header>
  )
}
