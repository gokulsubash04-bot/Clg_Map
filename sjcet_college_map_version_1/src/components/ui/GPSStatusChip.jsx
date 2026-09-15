import React from "react"
import { Navigation, AlertCircle, RefreshCw, Slash } from "lucide-react"
import { getCleanGpsStatus } from "../../lib/gpsNodeAdapter"

export function GPSStatusChip({ gpsStatus, accuracy }) {
  const { text, state, accuracyText } = getCleanGpsStatus(gpsStatus, accuracy)

  const IconComponent =
    state === "good"
      ? Navigation
      : state === "weak" || state === "locating"
      ? RefreshCw
      : Slash

  return (
    <div className={`gps-status-chip ${state}`}>
      <span className="gps-dot" />
      <IconComponent size={12} className={state === "locating" ? "animate-spin" : ""} />
      <span>{text}</span>
      {state === "good" && accuracyText !== "—" && (
        <span style={{ opacity: 0.8, fontSize: "11px", fontWeight: 400 }}>({accuracyText})</span>
      )}
    </div>
  )
}
