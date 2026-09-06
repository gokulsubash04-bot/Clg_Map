import { useState } from "react"
import MapView from "./components/MapView"
import BuildingModel3D from "./components/3d/BuildingModel3D"
import "./App.css"

function App() {
  const [viewMode, setViewMode] = useState("2d") // '2d' (Home) | '3d'
  const [targetBuilding, setTargetBuilding] = useState("ALL") // 'ALL' | 'SPB' | 'SJPB'

  const handleOpen3DView = (building = "ALL") => {
    setTargetBuilding(building)
    setViewMode("3d")
  }

  return (
    <div className="app-container">
      {/* Floating Dynamic Action Button (Only rendered in 2D Home view) */}
      {viewMode === "2d" && (
        <header className="main-app-nav-bar">
          <button
            className="single-toggle-btn switch-to-3d"
            onClick={() => {
              setTargetBuilding("ALL")
              setViewMode("3d")
            }}
          >
            <span className="btn-icon">🏢</span>
            <span>3D Building View</span>
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="view-content-wrapper">
        {viewMode === "2d" ? (
          <MapView onSelect3D={handleOpen3DView} />
        ) : (
          <BuildingModel3D
            targetBuilding={targetBuilding}
            onSwitchBuilding={(b) => setTargetBuilding(b)}
            onGoHome={() => setViewMode("2d")}
          />
        )}
      </main>
    </div>
  )
}

export default App



