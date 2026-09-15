import React, { useState, useMemo } from "react"
import { Search, Navigation, DoorClosed, Layers } from "lucide-react"
import { rooms, nodes } from "../../data/campusData"

export function RoomDirectoryView({ onSelectRoomForNavigation }) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", label: "All Facilities" },
    { id: "classrooms", label: "Classrooms" },
    { id: "labs", label: "Laboratories" },
    { id: "faculty", label: "Faculty Offices" },
    { id: "restrooms", label: "Restrooms" },
  ]

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [])

  const enrichedRooms = useMemo(() => {
    return rooms.map((r) => {
      const bNode = nodeById.get(r.buildingId)
      const bName = bNode ? bNode.name : "Campus Building"
      
      let type = "Classroom"
      let cat = "classrooms"

      if (r.id.toLowerCase().includes("lab")) {
        type = "Computer / Research Laboratory"
        cat = "labs"
      } else if (r.id.toLowerCase().includes("hod") || r.id.toLowerCase().includes("office")) {
        type = "Faculty / Department Office"
        cat = "faculty"
      } else if (r.id.toLowerCase().includes("rest") || r.id.toLowerCase().includes("toilet")) {
        type = "Restroom Facility"
        cat = "restrooms"
      }

      const floorLabel = r.floor === 0 ? "Ground Floor" : `${r.floor}st Floor`

      return {
        ...r,
        buildingName: bName,
        type,
        category: cat,
        floorLabel,
      }
    })
  }, [nodeById])

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enrichedRooms.filter((r) => {
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.buildingName.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [enrichedRooms, search, selectedCategory])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Find a Room</h1>
        <p className="page-description">
          Search classrooms, department offices, laboratories, and restrooms across campus blocks.
        </p>
      </div>

      <div className="search-filter-section">
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="room-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room code, building or department..."
          />
        </div>

        <div className="category-chips">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip-btn ${selectedCategory === c.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rooms-list">
        {filteredRooms.length === 0 ? (
          <div style={{ padding: "32px", textAli: "center", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
            No matching rooms or facilities found.
          </div>
        ) : (
          filteredRooms.map((r) => (
            <div key={r.id} className="room-card">
              <div className="room-info">
                <span className="room-code">{r.name}</span>
                <span className="room-sub">
                  {r.type} · {r.buildingName} ({r.floorLabel})
                </span>
              </div>

              <button
                className="btn-secondary"
                style={{ padding: "6px 12px" }}
                onClick={() => onSelectRoomForNavigation(r)}
              >
                <Navigation size={14} />
                <span>Navigate</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
