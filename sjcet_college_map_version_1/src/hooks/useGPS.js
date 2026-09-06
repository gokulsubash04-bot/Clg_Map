import { useCallback, useEffect, useRef, useState } from "react"
import { bearingDeg, haversineMeters } from "../lib/geo"

const GPS_MAX_ACCURACY_M = 80
const GPS_MAX_SPEED_MS = 15
const GPS_STALE_MS = 8000

class KalmanFilter1D {
  constructor(processNoise = 1e-5, measureNoise = 1e-4) {
    this.q = processNoise
    this.r = measureNoise
    this.p = 1
    this.x = null
    this.k = 0
  }

  update(measurement) {
    if (this.x === null) {
      this.x = measurement
      return measurement
    }

    this.p += this.q
    this.k = this.p / (this.p + this.r)
    this.x += this.k * (measurement - this.x)
    this.p *= (1 - this.k)
    return this.x
  }

  reset() {
    this.x = null
    this.p = 1
  }
}

function getInitialGpsStatus() {
  if (!navigator.geolocation) return "❌ GPS not supported"
  const h = window.location.hostname
  if (!window.isSecureContext && h !== "localhost" && h !== "127.0.0.1") return "❌ GPS blocked: use HTTPS"
  return "⏳ Requesting location..."
}

export function useGPS() {
  const [userLocation, setUserLocation] = useState(null)
  const [rawLocation, setRawLocation] = useState(null)
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  const [gpsStatus, setGpsStatus] = useState(getInitialGpsStatus)
  const [movementHeading, setMovementHeading] = useState(null)

  const kfLat = useRef(new KalmanFilter1D())
  const kfLng = useRef(new KalmanFilter1D())
  const prevFiltered = useRef(null)
  const prevTimestamp = useRef(null)
  const staleTimer = useRef(null)

  const resetStaleTimer = useCallback(() => {
    if (staleTimer.current) clearTimeout(staleTimer.current)
    staleTimer.current = setTimeout(() => {
      setGpsStatus((s) => (s.startsWith("✅") ? "⚠️ GPS signal stale" : s))
    }, GPS_STALE_MS)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation || gpsStatus.startsWith("❌")) return undefined

    const onSuccess = (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords
      const now = pos.timestamp

      setRawLocation([lat, lng])
      resetStaleTimer()

      if (accuracy > GPS_MAX_ACCURACY_M) {
        setGpsStatus(`⚠️ Weak GPS (±${accuracy.toFixed(0)}m)`)
        return
      }

      if (prevFiltered.current && prevTimestamp.current) {
        const dt = (now - prevTimestamp.current) / 1000
        const dist = haversineMeters(prevFiltered.current, [lat, lng])
        const impliedSpeed = dt > 0 ? dist / dt : 0
        if (impliedSpeed > GPS_MAX_SPEED_MS) {
          setGpsStatus(`⚠️ GPS jump rejected (${impliedSpeed.toFixed(0)} m/s)`)
          kfLat.current.reset()
          kfLng.current.reset()
          return
        }

        if (impliedSpeed > 0.5) {
          setMovementHeading(bearingDeg(prevFiltered.current, [lat, lng]))
        }
      }

      const measureNoise = Math.max(1e-8, (accuracy / 111320) ** 2)
      kfLat.current.r = measureNoise
      kfLng.current.r = measureNoise

      const filtered = [kfLat.current.update(lat), kfLng.current.update(lng)]
      prevFiltered.current = filtered
      prevTimestamp.current = now

      setUserLocation(filtered)
      setGpsAccuracy(accuracy)
      setGpsStatus(`✅ GPS Active (±${accuracy.toFixed(0)}m)`)
    }

    const onError = (err) => {
      const msgs = {
        1: "❌ Permission denied",
        2: "❌ Location unavailable",
        3: "⏱️ GPS timeout",
      }
      setGpsStatus(msgs[err.code] || "❌ GPS error")
    }

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    })

    return () => {
      navigator.geolocation.clearWatch(watchId)
      if (staleTimer.current) clearTimeout(staleTimer.current)
    }
  }, [gpsStatus, resetStaleTimer])

  return { userLocation, rawLocation, gpsAccuracy, gpsStatus, movementHeading }
}
