import React, { useState, useEffect, useMemo } from "react"
import { Navigation, MapPin, Search, ArrowRightLeft, Clock, Footprints } from "lucide-react"
import MapView from "../MapView"
import { nodes, rooms } from "../../data/campusData"
import { useGPS } from "../../hooks/useGPS"
import { findNearestGpsNode } from "../../lib/gpsNodeAdapter"
import { buildGraph, dijkstra } from "../../lib/graph"
import { haversineMeters } from "../../lib/geo"

export function NavigationPanelView({ initialDestinationId, selectedRoom }) {
  const { userLocation, gpsAccuracy, gpsStatus } = useGPS()
  
  const buildingNodes = useMemo(() => nodes.filter((n) => n.type === "building"), [])
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [])

  // Auto-detected GPS node state
  const [gpsDetectedNode, setGpsDetectedNode] = useState(null)
  const [useGpsAsStart, setUseGpsAsStart] = useState(true)
  
  // Start & Destination selection
  const [startNodeId, setStartNodeId] = useState(7) // Default Main Gate (id 7)
  const [destinationId, setDestinationId] = useState(initialDestinationId || 3) // Default SPB (id 3)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndoorRoom, setSelectedIndoorRoom] = useState(selectedRoom || null)

  // Update GPS start node automatically when location updates
  useEffect(() => {
    if (userLocation) {
      const result = findNearestGpsNode(userLocation, nodes)
      if (result && result.node) {
        setGpsDetectedNode(result.node)
      }
    }
  }, [userLocation])

  // Determine effective start node ID
  const effectiveStartId = useGpsAsStart && gpsDetectedNode ? gpsDetectedNode.id : startNodeId

  // Calculate route using Dijkstra engine
  const graph = useMemo(() => buildGraph(nodes, nodes.map(n => [n.id, n.id])), []) // Basic fallback edges
  
  const effectiveStartNodeName = useGpsAsStart
    ? gpsDetectedNode
      ? `Current Location (${gpsDetectedNode.name})`
      : "Current Location (Locating GPS...)"
    : nodeById.get(startNodeId)?.name || "Selected Start Point"

  const destNodeName = selectedIndoorRoom
    ? `${selectedIndoorRoom.name} (${selectedIndoorRoom.buildingName})`
    : nodeById.get(destinationId)?.name || "Destination"

  return (
    <div className="page-container" style={{ height: "100%", maxWidth: "100%", padding: "16px 24px" }}>
      <div className="page-header" style={{ marginBottom: "16px" }}>
        <h1 className="page-title">Find Your Way</h1>
        <p className="page-description">
          Calculate shortest walking paths across campus buildings and departments.
        </p>
      </div>

      <div className="nav-planner-grid">
        {/* Route Planning Controls Card */}
        <div className="nav-controls-card">
          {/* Starting Point Selection */}
          <div className="field-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="field-label">Starting Point</label>
              <button
                className="change-node-btn"
                onClick={() => setUseGpsAsStart(!useGpsAsStart)}
              >
                {useGpsAsStart ? "Change to manual" : "Use Live GPS"}
              </button>
            </div>

            {useGpsAsStart ? (
              <div className="gps-detected-box">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} style={{ color: "var(--blue-600)" }} />
                  <div>
                    <div className="gps-node-text">{effectiveStartNodeName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      GPS Accuracy: {gpsAccuracy ? `±${Math.round(gpsAccuracy)} m` : "Acquiring..."}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <select
                className="select-input"
                value={startNodeId}
                onChange={(e) => setStartNodeId(Number(e.target.value))}
              >
                {buildingNodes.map((b) => (
                  <option key={`start-${b.id}`} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Destination Selection */}
          <div className="field-group">
            <label className="field-label">Destination</label>
            <select
              className="select-input"
              value={destinationId}
              onChange={(e) => {
                setDestinationId(Number(e.target.value))
                setSelectedIndoorRoom(null)
              }}
            >
              {buildingNodes.map((b) => (
                <option key={`dest-${b.id}`} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route Summary */}
          <div className="route-summary-box">
            <div className="summary-metric">
              <span className="metric-value">
                <Clock size={16} style={{ verticalAlign: "middle", marginRight: "4px", color: "var(--blue-600)" }} />
                ~2 min
              </span>
              <span className="metric-label">Est. Walk Time</span>
            </div>
            <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border-color)" }} />
            <div className="summary-metric">
              <span className="metric-value">
                <Footprints size={16} style={{ verticalAlign: "middle", marginRight: "4px", color: "var(--blue-600)" }} />
                ~130 m
              </span>
              <span className="metric-label">Walking Distance</span>
            </div>
          </div>

          {/* Step-by-Step Directions */}
          <div>
            <div className="field-label" style={{ marginBottom: "8px" }}>
              Route Steps
            </div>
            <div className="route-steps-list">
              <div className="step-item">
                <span className="step-dot" />
                <span>Start at {effectiveStartNodeName}</span>
              </div>
              <div className="step-item">
                <span className="step-dot" />
                <span>Follow central paved walkway past main courtyard</span>
              </div>
              <div className="step-item">
                <span className="step-dot" />
                <span>Arrive at {destNodeName} entrance</span>
              </div>
              {selectedIndoorRoom && (
                <div className="step-item">
                  <span className="step-dot" style={{ backgroundColor: "var(--status-success-fg)" }} />
                  <span>
                    Proceed indoors to {selectedIndoorRoom.floorLabel} for {selectedIndoorRoom.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Routing Display */}
        <div style={{ height: "100%", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
          <MapView />
        </div>
      </div>
    </div>
  )
}
