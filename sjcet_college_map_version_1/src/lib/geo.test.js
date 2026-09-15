import { describe, expect, it } from "vitest"
import { bearingDeg, haversineMeters } from "./geo"

describe("geo helpers", () => {
  it("returns near-zero distance for same point", () => {
    const d = haversineMeters([9.0, 76.0], [9.0, 76.0])
    expect(d).toBeLessThan(0.001)
  })

  it("returns north-ish bearing for increasing latitude", () => {
    const b = bearingDeg([9.0, 76.0], [9.001, 76.0])
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThanOrEqual(20)
  })
})
