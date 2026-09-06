import { haversineMeters } from "./geo"

/* =========================
   BASIC GRAPH — same shape/behavior as before:
   graph = { [nodeId]: [{ to, dist }, ...] }
   dijkstra returns an array of node ids (path), same as before.
========================= */

export function uniquePairs(edgesArr) {
  const seen = new Set()
  const out = []
  for (const [a, b] of edgesArr) {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push([a, b])
    }
  }
  return out
}

export function buildGraph(nodesArr, edgesArr) {
  const map = new Map(nodesArr.map((n) => [n.id, n]))
  const graph = {}
  for (const n of nodesArr) graph[n.id] = []
  for (const [a, b] of edgesArr) {
    const na = map.get(a)
    const nb = map.get(b)
    if (!na || !nb) continue
    const dist = Math.round(haversineMeters(na.pos, nb.pos))
    graph[a].push({ to: b, dist })
    graph[b].push({ to: a, dist })
  }
  return graph
}

export function dijkstra(graph, start, end) {
  if (start === null || start === undefined || end === null || end === undefined) return []

  const dist = {}
  const prev = {}
  const visited = new Set()

  Object.keys(graph).forEach((k) => {
    dist[k] = Infinity
  })
  if (!(start in dist)) return [] // start node not in graph
  dist[start] = 0

  while (true) {
    let closest = null
    let min = Infinity
    for (const k in dist) {
      if (!visited.has(k) && dist[k] < min) {
        min = dist[k]
        closest = k
      }
    }

    if (closest === null) break
    // closest is always a string (object key); compare against end loosely
    // so both numeric ids (9) and string ids ("you", "SPB-001") work.
    // eslint-disable-next-line eqeqeq
    if (closest == end) break

    visited.add(closest)
    for (const e of graph[closest] || []) {
      const alt = dist[closest] + e.dist
      if (alt < dist[e.to]) {
        dist[e.to] = alt
        prev[e.to] = closest
      }
    }
  }

  const path = []
  let cur = end
  while (cur !== undefined) {
    const parsed = Number(cur)
    path.unshift(isNaN(parsed) ? cur : parsed)
    cur = prev[cur]
  }
  return path
}


/** Backward-compatible nearest-node lookup. No longer used for routing in
 *  MapView (see snapUserToGraph below), but kept in case anything else
 *  in the app still imports it. */
export function nearestNodeId(userPos, accuracy, nodesArr) {
  if (!userPos?.[0] || !userPos?.[1]) return null

  const confidenceRadius = Math.max(accuracy ?? 30, 20)
  let best = null
  let bestScore = Infinity

  for (const n of nodesArr) {
    const d = haversineMeters(userPos, n.pos)
    if (d <= confidenceRadius) {
      const score = d / confidenceRadius
      if (score < bestScore) {
        bestScore = score
        best = n
      }
    }
  }

  if (!best) {
    let fallbackBest = null
    let fallbackBestD = Infinity
    for (const n of nodesArr) {
      const d = haversineMeters(userPos, n.pos)
      if (d < fallbackBestD) {
        fallbackBestD = d
        fallbackBest = n
      }
    }
    best = fallbackBest
  }

  return best?.id ?? null
}

/* =========================
   EDGE SNAPPING
   Replaces "nearest node" with "nearest point on the nearest walkway
   edge" — projecting the GPS fix onto the path network instead of
   jumping to whichever junction/building happens to be closest.
========================= */

function projectOnSegment(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b
  const abx = bx - ax, aby = by - ay
  const apx = px - ax, apy = py - ay
  const lenSq = abx * abx + aby * aby
  let t = lenSq === 0 ? 0 : (apx * abx + apy * aby) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { point: [ax + t * abx, ay + t * aby], t }
}

function ccw(a, b, c) {
  return (c[1] - a[1]) * (b[0] - a[0]) - (b[1] - a[1]) * (c[0] - a[0])
}

function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = ccw(p3, p4, p1), d2 = ccw(p3, p4, p2)
  const d3 = ccw(p1, p2, p3), d4 = ccw(p1, p2, p4)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

function crossesAnyBuilding(a, b, buildings) {
  for (const building of buildings) {
    const ring = building.polygon
    if (!ring) continue
    for (let i = 0; i < ring.length; i++) {
      if (segmentsIntersect(a, b, ring[i], ring[(i + 1) % ring.length])) return true
    }
  }
  return false
}

/**
 * Finds the best walkable point to start routing from.
 * `buildings` is optional: [{ polygon: [[lat,lng], ...] }]. Once you
 * digitize building footprints, pass them here and snapping will refuse
 * any point that would require walking through a wall. Until then, this
 * still fixes the main problem — snapping to the path itself instead of
 * the nearest junction/building marker.
 */
export function snapUserToGraph(userPos, nodesArr, edgesArr, buildings = []) {
  if (!userPos?.[0] || !userPos?.[1]) return null
  const nodeById = new Map(nodesArr.map((n) => [n.id, n]))

  const candidates = edgesArr
    .map(([aId, bId]) => {
      const a = nodeById.get(aId), b = nodeById.get(bId)
      if (!a || !b) return null
      const { point, t } = projectOnSegment(userPos, a.pos, b.pos)
      return { aId, bId, point, t, dist: haversineMeters(userPos, point) }
    })
    .filter(Boolean)
    .sort((x, y) => x.dist - y.dist)

  if (candidates.length === 0) return null

  if (buildings.length > 0) {
    const clear = candidates.slice(0, 8).find((c) => !crossesAnyBuilding(userPos, c.point, buildings))
    if (clear) return clear
    return { ...candidates[0], approximate: true }
  }

  return candidates[0]
}

/**
 * Builds a routing graph augmented with a temporary "you" node inserted
 * at the snapped position, connected to both endpoints of the edge it
 * sits on with the correct partial distances. Routing then starts from
 * "you" instead of from whichever real node happens to be nearest.
 */
export function buildAugmentedGraph(nodesArr, edgesArr, snap) {
  const baseGraph = buildGraph(nodesArr, edgesArr)

  if (!snap) return { graph: baseGraph, startId: null, virtualNode: null }
  if (snap.t <= 0.02) return { graph: baseGraph, startId: snap.aId, virtualNode: null }
  if (snap.t >= 0.98) return { graph: baseGraph, startId: snap.bId, virtualNode: null }

  const nodeById = new Map(nodesArr.map((n) => [n.id, n]))
  const a = nodeById.get(snap.aId)
  const b = nodeById.get(snap.bId)
  if (!a || !b) return { graph: baseGraph, startId: null, virtualNode: null }

  const virtualId = "you"
  const virtualNode = { id: virtualId, name: "Your location", type: "virtual", pos: snap.point }

  const distToA = Math.round(haversineMeters(snap.point, a.pos))
  const distToB = Math.round(haversineMeters(snap.point, b.pos))

  baseGraph[virtualId] = [
    { to: snap.aId, dist: distToA },
    { to: snap.bId, dist: distToB },
  ]
  baseGraph[snap.aId].push({ to: virtualId, dist: distToA })
  baseGraph[snap.bId].push({ to: virtualId, dist: distToB })

  return { graph: baseGraph, startId: virtualId, virtualNode }
}