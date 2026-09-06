import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import L from "leaflet"
import { Circle, LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import { nodes, edges, rooms } from "../data/campusData"
import { useDeviceHeading } from "../hooks/useDeviceHeading"
import { useGPS } from "../hooks/useGPS"
import { buildAugmentedGraph, buildGraph, dijkstra, snapUserToGraph, uniquePairs } from "../lib/graph"
import { haversineMeters } from "../lib/geo"
import { AnimatedRoute } from "./map/AnimatedRoute"
import { MapControls } from "./map/MapControls"
import "./MapView.css"



const Motion = motion

/* =========================
   PALETTE — actual Google Maps colors, not a custom brand.
   Keep in sync with MapView.css.
========================= */
const COLORS = {
  ink: "#202124",
  inkSoft: "#5f6368",
  accent: "#1a73e8",
  accentDark: "#174ea6",
  accentSoft: "#e8f0fe",
  red: "#ea4335",
  border: "#dadce0",
  paper: "#f2f3f5",
}



delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const { BaseLayer } = LayersControl

/* Big teardrop pin — reserved for the currently selected destination,
   exactly how Google Maps only pins your search result, not every POI. */
const pinIcon = (color = COLORS.red, size = 30) =>
  L.divIcon({
    className: "gm-pin-icon",
    html: `
      <div style="width:${size}px;height:${size + 12}px;display:flex;align-items:center;justify-content:center;">
        <svg width="${size}" height="${size + 12}" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
          <path d="M12 0C5.9 0 1 4.9 1 11c0 8.2 11 23 11 23s11-14.8 11-23C23 4.9 18.1 0 12 0z" fill="${color}"/>
          <circle cx="12" cy="11" r="4.2" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
  })



const gpsArrowIcon = (heading = 0, hasHeading = false) =>
  L.divIcon({
    className: "gm-user-location-icon",
    html: `
      <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:transparent;">
        <svg width="26" height="26" viewBox="0 0 24 24" style="transform:rotate(${heading}deg);transform-origin:50% 50%;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.25));">
          ${hasHeading
            ? `<path d="M12 2 L19 20 L12 16 L5 20 Z" fill="${COLORS.accent}"/>`
            : `<circle cx="12" cy="12" r="8" fill="${COLORS.accent}" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="12" fill="none" stroke="${COLORS.accent}" stroke-opacity="0.3" stroke-width="2"/>`
          }
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

function MapRefCapturer({ mapRef }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map, mapRef])
  return null
}

function FlyToTarget({ target, isSatellite }) {
  const map = useMap()
  useEffect(() => {
    if (target?.pos) {
      const zoom = isSatellite ? 18 : 19
      map.flyTo(target.pos, zoom, { animate: true, duration: 0.8 })
    }
  }, [target, isSatellite, map])
  return null
}

function MapLayerZoomController({ onBaseLayerChange }) {
  const map = useMap()

  useEffect(() => {
    const handleBaseLayerChange = (e) => {
      onBaseLayerChange?.(e.name)
      if (e.name === "Satellite") {
        map.setMaxZoom(18)
        if (map.getZoom() > 18) {
          map.setZoom(18)
        }
      } else {
        map.setMaxZoom(22)
      }
    }

    map.on("baselayerchange", handleBaseLayerChange)
    return () => {
      map.off("baselayerchange", handleBaseLayerChange)
    }
  }, [map, onBaseLayerChange])

  return null
}


function MapClickHandler({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onPick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}


function cleanStatusText(s) {
  return s.replace(/^[^\p{L}\p{N}]+/u, "").trim()
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="#5f6368" strokeWidth="2" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const MapView = ({ onSelect3D, onSelectSPB3D }) => {
  const campusCenter = [9.7269418549, 76.7261374431]

  const { userLocation, gpsAccuracy, gpsStatus, movementHeading } = useGPS()

  const [destinationId, setDestinationId] = useState(9)
  const [startBuildingId, setStartBuildingId] = useState(7)
  const [indoorDestination, setIndoorDestination] = useState(null)

  const targeted3DBuilding = useMemo(() => {
    const isSPB =
      destinationId === 3 ||
      startBuildingId === 3 ||
      (indoorDestination && (indoorDestination.buildingName?.includes("SPB") || indoorDestination.name?.startsWith("SPB")))

    const isSJPB =
      destinationId === 10 ||
      startBuildingId === 10 ||
      (indoorDestination && (indoorDestination.buildingName?.includes("SJPB") || indoorDestination.name?.startsWith("SJPB")))

    if (isSPB && isSJPB) return "ALL"
    if (isSPB) return "SPB"
    if (isSJPB) return "SJPB"
    return null
  }, [destinationId, startBuildingId, indoorDestination])

  const handleOpen3D = (bName) => {
    if (onSelect3D) onSelect3D(bName)
    else if (onSelectSPB3D) onSelectSPB3D()
  }
  const [startType, setStartType]         = useState("building")
  const [manualStartPos, setManualStartPos] = useState(null)
  const [baseLayerName, setBaseLayerName] = useState("Street")
  const [flyTarget, setFlyTarget]         = useState(null)

  const [follow, setFollow]               = useState(false)
  const [panelOpen, setPanelOpen]         = useState(true)
  const [panelMode, setPanelMode]         = useState("mid")
  const [isMobile, setIsMobile]           = useState(false)
  const [search, setSearch]               = useState("")
  const [searchOpen, setSearchOpen]       = useState(false)
  const [toast, setToast]                 = useState(null)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const mapRef = useRef(null)
  const sheetTouchStartY = useRef(null)
  const { heading: compassHeading, headingAvailable } = useDeviceHeading()

  const heading = headingAvailable ? compassHeading : (movementHeading ?? 0)
  const hasAnyHeading = headingAvailable || movementHeading !== null

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)")
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener?.("change", apply)
    return () => mq.removeEventListener?.("change", apply)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const effectivePanelMode = !isMobile ? "desktop" : (!panelOpen ? "collapsed" : panelMode)

  // Derived
  const nodeById  = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [])
  const safeEdges = useMemo(() => uniquePairs(edges), [])

  // Effective start point: pos or node
  const effectiveStart = useMemo(() => {
    if (startType === "gps") {
      return userLocation ? { type: "pos", pos: userLocation } : null
    }
    if (startType === "custom") {
      return manualStartPos ? { type: "pos", pos: manualStartPos } : null
    }
    // "building"
    const b = nodeById.get(startBuildingId)
    return b ? { type: "node", id: b.id, pos: b.pos, name: b.name } : null
  }, [startType, userLocation, manualStartPos, startBuildingId, nodeById])

  // Edge-snapped routing: projects coordinate onto nearest walkway edge
  const snap = useMemo(
    () => (effectiveStart?.type === "pos" ? snapUserToGraph(effectiveStart.pos, nodes, safeEdges, []) : null),
    [effectiveStart, safeEdges]
  )

  const { graph, startId: startNodeId, virtualNode } = useMemo(() => {
    if (effectiveStart?.type === "node") {
      return { graph: buildGraph(nodes, safeEdges), startId: effectiveStart.id, virtualNode: null }
    }
    if (snap) {
      return buildAugmentedGraph(nodes, safeEdges, snap)
    }
    return { graph: buildGraph(nodes, safeEdges), startId: null, virtualNode: null }
  }, [effectiveStart, snap, safeEdges])

  const nearestEdgeNodeName = useMemo(() => {
    if (!snap) return null
    const closer = snap.t < 0.5 ? snap.aId : snap.bId
    return nodeById.get(closer)?.name
  }, [snap, nodeById])

  const startNodeName = useMemo(() => {
    if (startType === "building") {
      return nodeById.get(startBuildingId)?.name || "Selected starting building"
    }
    if (startType === "custom") {
      if (!manualStartPos) return "Tap map to set start location"
      return nearestEdgeNodeName ? `Near ${nearestEdgeNodeName}` : "Custom point on map"
    }
    if (!userLocation) return "Finding your location…"
    if (virtualNode) return nearestEdgeNodeName ? `Near ${nearestEdgeNodeName}` : "Your location"
    return nodeById.get(startNodeId)?.name || "Your location"
  }, [startType, startBuildingId, manualStartPos, nearestEdgeNodeName, userLocation, virtualNode, startNodeId, nodeById])

  const pathIds = useMemo(
    () => (startNodeId && destinationId ? dijkstra(graph, startNodeId, destinationId) : []),
    [graph, startNodeId, destinationId]
  )
  const pathCoords = useMemo(
    () => pathIds
      .map((id) => (id === "you" ? virtualNode?.pos : nodeById.get(Number(id))?.pos))
      .filter(Boolean),

    [pathIds, virtualNode, nodeById]
  )
  const routeStats = useMemo(() => {
    if (pathCoords.length < 2) return null
    let distanceMeters = 0
    for (let i = 0; i < pathCoords.length - 1; i++) {
      distanceMeters += haversineMeters(pathCoords[i], pathCoords[i + 1])
    }
    // 1.2 m/s average walking speed -> time in minutes (at least 1 min)
    const timeMinutes = Math.max(1, Math.round(distanceMeters / (1.2 * 60)))
    return {
      distance: distanceMeters,
      time: timeMinutes,
    }
  }, [pathCoords])

  const edgeLines = useMemo(
    () => safeEdges.map(([a,b]) => {
      const na = nodeById.get(a), nb = nodeById.get(b)
      return na && nb ? [na.pos, nb.pos] : null
    }).filter(Boolean),
    [safeEdges, nodeById]
  )
  const buildingNodes = useMemo(() => nodes.filter((n) => n.type === "building"), [])

  const searchItems = useMemo(() => [
    ...buildingNodes.map((b) => ({ type: "building", id: String(b.id), label: b.name, nodeId: b.id, pos: b.pos })),
    ...rooms.map((r) => ({ type: "room", id: r.id, label: r.name, buildingId: r.buildingId, floor: r.floor, steps: r.indoorSteps })),
  ], [buildingNodes])

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return searchItems.filter((it) => it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q)).slice(0, 10)
  }, [search, searchItems])

  const selectSuggestion = useCallback((it) => {
    if (!it) return
    if (it.type === "building") {
      setDestinationId(it.nodeId)
      setIndoorDestination(null)
      setSearch(it.label)
      setSearchOpen(false)
      setFlyTarget({ pos: it.pos, ts: Date.now() })
      return
    }
    const b = nodeById.get(it.buildingId)
    if (!b) return
    setDestinationId(b.id)
    setIndoorDestination({ name: it.label, buildingName: b.name, floor: it.floor, steps: it.steps })
    setSearch(it.label)
    setSearchOpen(false)
    setFlyTarget({ pos: b.pos, ts: Date.now() })
    setToast(`${it.label} is in ${b.name}`)
  }, [nodeById])

  const closeSearchSoon = () => setTimeout(() => {
    setSearchOpen(false)
    setActiveSuggestionIndex(-1)
  }, 150)

  // GPS status — Google Maps doesn't nag you with a persistent accuracy
  // badge once location works; the chip only appears when something
  // actually needs your attention.
  const gpsPhase = gpsStatus.startsWith("✅") ? "good"
    : gpsStatus.startsWith("⚠️") ? "weak"
    : gpsStatus.startsWith("⏳") ? "locating"
    : "denied"

  const showGpsChip = gpsPhase !== "good"
  const gpsChipColors = {
    weak:     { bg: "#fef7e0", fg: "#b06000", dot: "#f9ab00" },
    locating: { bg: "#f1f3f4", fg: COLORS.inkSoft, dot: "#9aa0a6" },
    denied:   { bg: "#fce8e6", fg: "#c5221f", dot: "#ea4335" },
  }[gpsPhase]

  const panelStyle = isMobile
    ? { position:"absolute",left:10,right:10,top:10,zIndex:1000,background:"white",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.3)",overflow:"hidden",fontFamily:"Roboto,Arial,sans-serif" }
    : { position:"absolute",top:12,left:12,zIndex:1000,background:"white",padding:12,borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,0.3)",width:360,fontFamily:"Roboto,Arial,sans-serif" }

  return (
    <div className="gm-map-shell" style={{ position: "fixed", inset: 0, overflow: "hidden" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Motion.div key="toast" className="gm-toast"
            initial={{ opacity:0, y:10, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:10, scale:0.97 }}
            style={{ position:"absolute",left:"50%",transform:"translateX(-50%)",top:16,zIndex:3000,background:"#202124",color:"white",padding:"8px 14px",borderRadius:8,fontWeight:500,fontSize:13,boxShadow:"0 1px 4px rgba(0,0,0,0.3)",whiteSpace:"nowrap",fontFamily:"Roboto,Arial,sans-serif" }}
          >
            {toast}
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        <Motion.div key="panel" className={`gm-panel ${isMobile ? "gm-panel-mobile" : "gm-panel-desktop"} ${isMobile ? `gm-panel-${effectivePanelMode}` : ""}`}
          initial={{ opacity:0, y:isMobile?18:-10, scale:0.98 }}
          animate={{ opacity:1, y:0, scale:1, transition:{ type:"spring",stiffness:320,damping:26 } }}
          exit={{ opacity:0, y:isMobile?18:-10, scale:0.98 }}
          style={panelStyle}
          onTouchStart={(e) => {
            if (!isMobile) return
            sheetTouchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={(e) => {
            if (!isMobile || sheetTouchStartY.current === null) return
            const dy = e.changedTouches[0].clientY - sheetTouchStartY.current
            if (dy < -30) setPanelMode("expanded")
            if (dy > 40) setPanelMode("mid")
            sheetTouchStartY.current = null
          }}
        >
          <div className="gm-panel-content" style={{ padding: 14 }}>
            {isMobile && <div className="gm-sheet-handle" />}
            {/* Header */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
              <div style={{ fontWeight:500,fontSize:18,color:COLORS.ink }}>SJCET Campus Navigator</div>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                {showGpsChip && (
                  <div style={{
                    display:"flex",alignItems:"center",gap:6,
                    fontSize:12,padding:"4px 10px",borderRadius:12,fontWeight:500,whiteSpace:"nowrap",
                    background: gpsChipColors.bg, color: gpsChipColors.fg,
                  }}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:gpsChipColors.dot }} />
                    {gpsPhase === "locating" ? "Locating…" : cleanStatusText(gpsStatus)}
                  </div>
                )}
                {isMobile && (
                  <button onClick={() => setPanelOpen((v) => !v)}
                    className="gm-btn-secondary"
                    style={{ border:`1px solid ${COLORS.border}`,background:"white",borderRadius:6,padding:"6px 10px",fontWeight:500,cursor:"pointer",color:COLORS.inkSoft }}>
                    {panelOpen ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>

            {(!isMobile || panelOpen) && (
              <>
                {/* Start Location Selector */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft }}>Start location</span>
                    {startType === "custom" && (
                      <span style={{ fontSize: 11, color: "#188038", fontWeight: 600 }}>
                        {manualStartPos ? "✓ Start pin placed" : "Tap on map to set pin"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select
                      aria-label="Choose starting location"
                      value={startType === "building" ? String(startBuildingId) : startType}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "gps") {
                          setStartType("gps")
                          if (!userLocation) setToast("Searching for GPS signal...")
                          else setFlyTarget({ pos: userLocation, ts: Date.now() })
                        } else if (val === "custom") {
                          setStartType("custom")
                          setToast("Tap anywhere on the map to set starting point")
                        } else {
                          setStartType("building")
                          const id = Number(val)
                          setStartBuildingId(id)
                          const node = nodeById.get(id)
                          if (node) setFlyTarget({ pos: node.pos, ts: Date.now() })
                        }
                      }}
                      className="gm-select"
                      style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontWeight: 500, color: COLORS.ink, fontSize: 14 }}
                    >
                      <option value="gps">📍 Your live location {userLocation ? "" : "(searching GPS...)"}</option>
                      <optgroup label="Campus Buildings">
                        {buildingNodes.map((b) => (
                          <option key={`start-${b.id}`} value={String(b.id)}>{b.name}</option>
                        ))}
                      </optgroup>
                      <option value="custom">📌 Tap on map to set start...</option>
                    </select>

                    {/* Swap button */}
                    <button
                      type="button"
                      title="Swap start and destination"
                      aria-label="Swap start and destination"
                      onClick={() => {
                        if (startType === "building") {
                          const oldStart = startBuildingId
                          const oldDest = destinationId
                          setStartBuildingId(oldDest)
                          setDestinationId(oldStart)
                          setIndoorDestination(null)
                          setToast("Swapped start and destination")
                        } else {
                          setStartBuildingId(destinationId)
                          setStartType("building")
                          setToast("Set previous destination as start")
                        }
                      }}
                      className="gm-btn-secondary"
                      style={{ width: 38, height: 38, border: `1px solid ${COLORS.border}`, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.inkSoft, flexShrink: 0 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Destination Search & Dropdown */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 5 }}>Destination</div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}>
                      <SearchIcon />
                    </span>
                    <input
                      aria-label="Search destination by building or room"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); setActiveSuggestionIndex(0) }}
                      onFocus={() => setSearchOpen(true)}
                      onBlur={closeSearchSoon}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          setSearchOpen(true)
                          setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1))
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault()
                          setSearchOpen(true)
                          setActiveSuggestionIndex((i) => Math.max(i - 1, 0))
                        }
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const chosen = suggestions[activeSuggestionIndex] || suggestions[0]
                          const q = search.trim().toLowerCase()
                          const exact = suggestions.find((s) => s.id?.toLowerCase() === q || s.label?.toLowerCase() === q)
                          selectSuggestion(exact || chosen)
                        }
                        if (e.key === "Escape") {
                          setSearchOpen(false)
                          setActiveSuggestionIndex(-1)
                        }
                      }}
                      placeholder="Search buildings or rooms"
                      className="gm-search-input"
                      style={{ width:"100%",padding:"11px 12px 11px 38px",borderRadius:24,border:`1px solid ${COLORS.border}`,outline:"none",fontWeight:400,fontSize:14,boxSizing:"border-box",boxShadow:"0 1px 2px rgba(60,64,67,0.15)" }}
                    />

                    {searchOpen && (
                      <div className="gm-suggestion-list" style={{ position:"absolute",top:"105%",left:0,right:0,background:"white",borderRadius:12,border:"1px solid #e8eaed",boxShadow:"0 4px 12px rgba(60,64,67,0.3)",overflow:"hidden",zIndex:3000,maxHeight:280,overflowY:"auto" }}>
                        {suggestions.length === 0 && (
                          <div style={{ padding: "10px 14px", fontSize: 12, color: COLORS.inkSoft }}>No matching destination</div>
                        )}
                        {suggestions.map((it, idx) => (
                          <div
                            key={`${it.type}-${it.id}`}
                            onMouseDown={(e) => { e.preventDefault(); selectSuggestion(it) }}
                            onTouchEnd={(e) => { e.preventDefault(); selectSuggestion(it) }}
                            style={{ padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,borderTop:"1px solid #f1f3f4",background: activeSuggestionIndex === idx ? COLORS.accentSoft : "white" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f3f4"; setActiveSuggestionIndex(idx) }}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                          >
                            <span style={{ fontWeight:500,fontSize:14,color:COLORS.ink }}>{it.label}</span>
                            <span style={{ color:COLORS.inkSoft,fontSize:11,background:"#f1f3f4",padding:"2px 8px",borderRadius:999,whiteSpace:"nowrap" }}>
                              {it.type === "room" ? `Floor ${it.floor}` : "Building"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination dropdown */}
                <div style={{ marginTop: 8 }}>
                  <select
                    aria-label="Choose destination building"
                    value={destinationId}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      setDestinationId(id)
                      setIndoorDestination(null)
                      const node = nodeById.get(id)
                      if (node) setFlyTarget({ pos: node.pos, ts: Date.now() })
                    }}
                    className="gm-select"
                    style={{ width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${COLORS.border}`,outline:"none",fontWeight:500,color:COLORS.ink,fontSize:14 }}
                  >
                    {buildingNodes.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Directions summary — two rows with a connecting line,
                    like Google Maps' from/to card. */}
                <div style={{ marginTop:12,display:"flex",gap:10 }}>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",paddingTop:3 }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:"#188038" }} />
                    <span style={{ width:1,flex:1,minHeight:16,background:COLORS.border,margin:"2px 0" }} />
                    <span style={{ width:8,height:8,borderRadius:2,background:COLORS.red }} />
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:14,fontSize:13,color:COLORS.ink,flex:1,minWidth:0 }}>
                    <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{startNodeName}</div>
                    <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{nodeById.get(destinationId)?.name ?? "—"}</div>
                  </div>
                </div>

                {routeStats && (
                  <div style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: COLORS.accentSoft,
                    color: COLORS.ink,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 14,
                    fontWeight: 500,
                    border: `1px solid ${COLORS.border}`
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: COLORS.accent }}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{routeStats.time} {routeStats.time === 1 ? 'min' : 'mins'}</span>
                    </span>
                    <span style={{ color: COLORS.inkSoft, fontSize: 13 }}>
                      {routeStats.distance < 1000
                        ? `${Math.round(routeStats.distance)} m`
                        : `${(routeStats.distance / 1000).toFixed(1)} km`}
                    </span>
                  </div>
                )}

                {snap?.approximate && (
                  <div style={{ marginTop:6,fontSize:11,color:"#b06000" }}>
                    Your location looks a little off the path — the route may not be exact.
                  </div>
                )}

                {/* Indoor directions — not live-tracked, since GPS doesn't
                    work reliably indoors. Shown once a room is selected. */}
                {indoorDestination && (
                  <div className="gm-indoor-directions">
                    <div className="gm-indoor-directions-title">
                      {indoorDestination.name} · {indoorDestination.buildingName} · floor {indoorDestination.floor}
                    </div>
                    <ol>
                      {(indoorDestination.steps && indoorDestination.steps.length > 0
                        ? indoorDestination.steps
                        : [
                            `Enter ${indoorDestination.buildingName}.`,
                            `Go to floor ${indoorDestination.floor}.`,
                            "Check the floor directory if you can't find the room.",
                          ]
                      ).map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        </Motion.div>
      </AnimatePresence>

      {/* 3D Auto-Trigger Banner */}
      {targeted3DBuilding && (
        <div className="spb-3d-banner" onClick={() => handleOpen3D(targeted3DBuilding)}>
          <span className="spb-icon">🏢</span>
          <div className="spb-text">
            <strong>
              {targeted3DBuilding === "ALL"
                ? "Campus 3D Model (SPB & SJPB) Selected"
                : targeted3DBuilding === "SPB"
                ? "St. Peter's Block (SPB) Selected"
                : "St. John Paul Block (SJPB) Selected"}
            </strong>
            <span>
              {targeted3DBuilding === "ALL"
                ? "Tap to load 3D Model for both buildings"
                : "Tap to load interactive 3D Building Model"}
            </span>
          </div>
          <button
            className="spb-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleOpen3D(targeted3DBuilding)
            }}
          >
            View 3D ➔
          </button>
        </div>
      )}

      {/* MAP */}
      <MapContainer className="gm-map-container" center={campusCenter} zoom={17} maxZoom={22} zoomControl={false} style={{ height:"100%",width:"100%" }}>
        <MapRefCapturer mapRef={mapRef} />
        <MapLayerZoomController onBaseLayerChange={setBaseLayerName} />
        <FlyToTarget target={flyTarget} isSatellite={baseLayerName === "Satellite"} />
        <MapClickHandler enabled={startType === "custom"} onPick={(pos) => {
          setManualStartPos(pos)
          setToast("Starting point set on map")
        }} />

        <ZoomControl position="topright" />

        <LayersControl position="topright">
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={18} maxZoom={18} attribution="Tiles © Esri" />
          </BaseLayer>
          <BaseLayer checked name="Street">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors" maxNativeZoom={19} maxZoom={22} />
          </BaseLayer>
        </LayersControl>


        <MapControls userLocation={userLocation} follow={follow} setFollow={setFollow} />

        {/* Live GPS position */}
        {userLocation && (
          <>
            <Circle center={userLocation} radius={gpsAccuracy || 20}
              pathOptions={{ color:COLORS.accent,fillColor:COLORS.accent,fillOpacity:0.12,weight:1 }} />
            <Marker position={userLocation} icon={gpsArrowIcon(heading, hasAnyHeading)} zIndexOffset={2000}>
              <Tooltip direction="top" offset={[0, -16]} opacity={0.92}>Your location</Tooltip>
            </Marker>
          </>
        )}

        {/* Start Marker (green pin) if start is a building */}
        {startType === "building" && (() => {
          const startNode = nodeById.get(startBuildingId)
          if (!startNode || startNode.id === destinationId) return null
          return (
            <Marker position={startNode.pos} icon={pinIcon("#188038")} zIndexOffset={1600}>
              <Tooltip direction="top" offset={[0, -32]} opacity={0.92}>Start: {startNode.name}</Tooltip>
              <Popup><b>{startNode.name}</b> (Starting Point)</Popup>
            </Marker>
          )
        })()}

        {/* Start Marker (draggable green pin) if start is custom coordinate */}
        {startType === "custom" && manualStartPos && (
          <Marker
            position={manualStartPos}
            icon={pinIcon("#188038")}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng()
                setManualStartPos([lat, lng])
              },
            }}
            zIndexOffset={1800}
          >
            <Tooltip direction="top" offset={[0, -32]} opacity={0.92}>Starting point</Tooltip>
            <Popup><b>Starting point</b><br/>Drag to fine-tune</Popup>
          </Marker>
        )}

        {/* Walkways */}
        {edgeLines.map((line, idx) => (
          <Polyline key={`e-${idx}`} positions={line}
            pathOptions={{ color:"rgba(60,64,67,0.25)",weight:2,opacity:0.7 }} />
        ))}

        {/* Destination building marker (red pin) */}
        {(() => {
          const destNode = nodeById.get(destinationId)
          if (!destNode) return null
          return (
            <Marker position={destNode.pos} icon={pinIcon(COLORS.red)} zIndexOffset={1500}>
              <Tooltip direction="top" offset={[0, -32]} opacity={0.92}>Destination: {destNode.name}</Tooltip>
              <Popup><b>{destNode.name}</b> (Destination)</Popup>
            </Marker>
          )
        })()}

        {/* Clickable SPB & SJPB 3D Building Markers on 2D Map */}
        {buildingNodes.map((b) => {
          if (b.id !== 3 && b.id !== 10) return null
          if (b.id === destinationId || b.id === startBuildingId) return null
          return (
            <Marker
              key={`b-marker-${b.id}`}
              position={b.pos}
              icon={pinIcon(COLORS.accent, 24)}
              zIndexOffset={1400}
              eventHandlers={{
                click: () => {
                  setDestinationId(b.id)
                  setIndoorDestination(null)
                  setFlyTarget({ pos: b.pos, ts: Date.now() })
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={0.92}>
                🏢 {b.name} (Click for 3D View)
              </Tooltip>
            </Marker>
          )
        })}

        {/* Route */}
        {pathCoords.length > 1 && (
          <>
            <Polyline positions={pathCoords} pathOptions={{ color:"#ffffff", weight:10, opacity:0.9, lineJoin:"round", lineCap:"round" }} />
            <AnimatedRoute positions={pathCoords} />
          </>
        )}
      </MapContainer>

    </div>
  )
}

export default MapView