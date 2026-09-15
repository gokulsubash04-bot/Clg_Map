import React, { useState } from "react"
import { useGPS } from "./hooks/useGPS"
import { Header } from "./components/ui/Header"

import { HomeView } from "./components/ui/HomeView"
import BuildingModel3D from "./components/3d/BuildingModel3D"

import "./index.css"
import "./components/ui/UI.css"
import "./App.css"

function App() {
  const { gpsStatus, gpsAccuracy } = useGPS()

  const [viewMode, setViewMode] = useState("2d") // '2d' (Campus Map) | '3d' (3D Building Model)
  const [activeTab, setActiveTab] = useState("map") // 'map' | 'satellite' | '3d'
  const [targetBuilding, setTargetBuilding] = useState("ALL") // 'ALL' loads both buildings with center courtyard

  const handleOpen3DView = (building = "ALL") => {
    setTargetBuilding(building || "ALL")
    setViewMode("3d")
    setActiveTab("3d")
  }

  const handleGoToMap = () => {
    setViewMode("2d")
    setActiveTab("map")
  }

  const handleTabChange = (tabId) => {
    if (tabId === "3d") {
      handleOpen3DView("ALL")
    } else {
      setViewMode("2d")
      setActiveTab(tabId)
    }
  }

  return (
    <div className="app-shell">
      {/* Main Full-Screen Layout */}
      <div className="app-main-layout">
        {/* Top Header with Mode Tabs */}
        <Header
          activeTab={activeTab}
          onNavigate={handleTabChange}
          gpsStatus={gpsStatus}
          gpsAccuracy={gpsAccuracy}
        />

        {/* Full-Screen Viewport Content */}
        <main className="view-viewport">
          {viewMode === "3d" ? (
            /* Untouched 3D Building Viewer (Both buildings + center courtyard) */
            <BuildingModel3D
              targetBuilding={targetBuilding}
              onSwitchBuilding={(b) => setTargetBuilding(b)}
              onGoHome={handleGoToMap}
            />
          ) : (
            /* 2D Leaflet Map View (Street or Satellite) */
            <HomeView
              onSelect3D={handleOpen3DView}
              baseLayer={activeTab === "satellite" ? "Satellite" : "Street"}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
