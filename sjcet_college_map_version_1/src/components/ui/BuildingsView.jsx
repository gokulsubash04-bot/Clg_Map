import React from "react"
import { Box, Navigation, Building2, ChevronRight } from "lucide-react"
import { nodes } from "../../data/campusData"

export function BuildingsView({ onSelect3D, onNavigateToBuilding }) {
  const buildingNodes = nodes.filter((n) => n.type === "building")

  // Additional metadata for building descriptions and 3D capabilities
  const buildingMeta = {
    3: { code: "SPB", desc: "St. Peter's Block · Engineering Depts & Labs", has3D: true, target3D: "SPB" },
    10: { code: "SJPB", desc: "St. John Paul Block · Academic Classrooms & Offices", has3D: true, target3D: "SJPB" },
    1: { code: "SJB", desc: "Main Administrative Block & Main Auditorium", has3D: false },
    2: { code: "LIB", desc: "Central College Library & Digital Resource Center", has3D: false },
    4: { code: "MTB", desc: "Mother Teresa Block · Mechanical & Civil Workshops", has3D: false },
    5: { code: "SFB", desc: "St. Francis Block · Research Labs & Innovation Center", has3D: false },
    12: { code: "NEWTON", desc: "Newton Block · Computer Science Dept & IT Labs", has3D: false },
    6: { code: "CANTEEN", desc: "Front Campus Canteen & Refreshment Hub", has3D: false },
    8: { code: "CANTEEN2", desc: "Madonna Canteen · Dining Facility", has3D: false },
    9: { code: "HALL", desc: "Einstein Hall · Seminar & Conference Hall", has3D: false },
    11: { code: "HOSTEL1", desc: "Girls Hostel Complex", has3D: false },
    13: { code: "HOSTEL2", desc: "St. Mary's Hostel", has3D: false },
    14: { code: "HALL2", desc: "St. Francis Hall", has3D: false },
    7: { code: "GATE", desc: "Main Campus Entrance Gate", has3D: false },
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Buildings</h1>
        <p className="page-description">
          Explore campus buildings, academic blocks, auditoriums, and facilities.
        </p>
      </div>

      <div className="buildings-grid">
        {buildingNodes.map((b) => {
          const meta = buildingMeta[b.id] || { code: "BUILDING", desc: "Campus Facility", has3D: false }

          return (
            <div key={b.id} className="building-card">
              <div>
                <div className="building-card-header">
                  <span className="building-badge">{meta.code}</span>
                  {meta.has3D && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "var(--blue-50)",
                        color: "var(--blue-600)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Box size={12} />
                      3D View
                    </span>
                  )}
                </div>

                <h3 className="building-title">{b.name}</h3>
                <p className="building-desc">{meta.desc}</p>
              </div>

              <div className="building-actions">
                {meta.has3D ? (
                  <button className="btn-primary" onClick={() => onSelect3D(meta.target3D)}>
                    <Box size={14} />
                    <span>View 3D Model</span>
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={() => onNavigateToBuilding(b.id)}>
                    <Navigation size={14} />
                    <span>Get Directions</span>
                  </button>
                )}

                {meta.has3D && (
                  <button
                    className="btn-secondary"
                    onClick={() => onNavigateToBuilding(b.id)}
                    title="Get directions to building"
                  >
                    <Navigation size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
