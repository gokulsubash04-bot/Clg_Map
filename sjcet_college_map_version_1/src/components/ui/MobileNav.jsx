import React from "react"
import { Home, Building2, DoorClosed, Navigation, MapPin } from "lucide-react"

export function MobileNav({ activeTab, onNavigate }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "buildings", label: "Buildings", icon: Building2 },
    { id: "rooms", label: "Rooms", icon: DoorClosed },
    { id: "navigation", label: "Navigate", icon: Navigation },
    { id: "location", label: "Location", icon: MapPin },
  ]

  return (
    <nav className="mobile-nav-bar">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
