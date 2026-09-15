import { useEffect, useState } from "react"

export function useDeviceHeading() {
  const [heading, setHeading] = useState(0)
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.webkitCompassHeading === "number" && e.webkitCompassHeadingAccuracy < 50) {
        setHeading(e.webkitCompassHeading)
        setAvailable(true)
        return
      }

      if (typeof e.alpha === "number") {
        setHeading(360 - e.alpha)
        setAvailable(true)
      }
    }

    if (
      typeof DeviceOrientationEvent !== "undefined"
      && typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((perm) => {
          if (perm === "granted") window.addEventListener("deviceorientation", handler, true)
        })
        .catch(() => {})
    } else {
      window.addEventListener("deviceorientation", handler, true)
    }

    return () => window.removeEventListener("deviceorientation", handler, true)
  }, [])

  return { heading, headingAvailable: available }
}
