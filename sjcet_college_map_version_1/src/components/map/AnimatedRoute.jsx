import { useEffect, useRef } from "react"
import { Polyline, useMap } from "react-leaflet"

export function AnimatedRoute({ positions }) {
  const polylineRef = useRef(null)
  const map = useMap()

  useEffect(() => {
    const layer = polylineRef.current
    if (!layer) return
    const el = layer.getElement?.()
    if (!el) return

    const makeSolid = () => {
      el.style.transition = ""
      el.style.strokeDasharray = ""
      el.style.strokeDashoffset = ""
    }

    const total = el.getTotalLength?.()
    if (!total) {
      makeSolid()
      return
    }

    el.style.strokeDasharray = `${total}`
    el.style.strokeDashoffset = `${total}`
    el.getBoundingClientRect()
    el.style.transition = "stroke-dashoffset 900ms ease"
    el.style.strokeDashoffset = "0"

    const t = setTimeout(makeSolid, 950)
    map.on("zoomend", makeSolid)
    return () => {
      clearTimeout(t)
      map.off("zoomend", makeSolid)
      makeSolid()
    }
  }, [positions, map])

  return (
    <Polyline
      ref={polylineRef}
      positions={positions}
      pathOptions={{ color: "#1a73e8", weight: 6, opacity: 0.95, lineJoin: "round", lineCap: "round" }}
    />
  )
}