import { haversineMeters } from "./geo"
import { nodes as defaultNodes } from "../data/campusData"

/**
 * GPS-to-Node Adapter with Hysteresis and Stability Logic
 * 
 * Prevents rapid jumping of starting nodes due to minor GPS fluctuations.
 */

// Minimum movement distance in meters to evaluate node switching
const STABILITY_MOVEMENT_THRESHOLD_M = 3.0

// Candidate node must be at least this much closer (meters) than current node to switch
const NODE_SWITCH_HYSTERESIS_M = 6.0

// Maximum distance in meters to consider a node "nearby"
const MAX_NEARBY_DISTANCE_M = 150.0

export function findNearestGpsNode(
  userLocation,
  nodesArr = defaultNodes,
  previousState = { nodeId: null, pos: null }
) {
  if (!userLocation || !Array.isArray(userLocation) || userLocation.length < 2) {
    return {
      node: null,
      distance: null,
      isReliable: false,
      status: "GPS position unavailable",
    }
  }

  // Filter valid nodes (buildings and key campus points)
  const candidateNodes = nodesArr.filter(
    (n) => n.pos && Array.isArray(n.pos) && n.pos.length === 2
  )

  if (candidateNodes.length === 0) {
    return {
      node: null,
      distance: null,
      isReliable: false,
      status: "No campus nodes found",
    }
  }

  // Calculate distance to all nodes
  const scoredNodes = candidateNodes
    .map((node) => {
      const dist = haversineMeters(userLocation, node.pos)
      return { node, dist }
    })
    .sort((a, b) => a.dist - b.dist)

  const closest = scoredNodes[0]

  // Check if user location hasn't moved significantly since last check
  if (previousState.pos && previousState.nodeId) {
    const moveDist = haversineMeters(userLocation, previousState.pos)
    
    // If position barely changed, stick to previous node
    if (moveDist < STABILITY_MOVEMENT_THRESHOLD_M) {
      const prevNode = candidateNodes.find((n) => n.id === previousState.nodeId)
      if (prevNode) {
        const prevDist = haversineMeters(userLocation, prevNode.pos)
        return {
          node: prevNode,
          distance: Math.round(prevDist),
          isReliable: prevDist <= MAX_NEARBY_DISTANCE_M,
          status: `Near ${prevNode.name}`,
        }
      }
    }

    // Evaluate if the new closest node is significantly closer than the previous node
    const prevNode = candidateNodes.find((n) => n.id === previousState.nodeId)
    if (prevNode) {
      const prevDist = haversineMeters(userLocation, prevNode.pos)
      // If current node is still reasonably close and new node isn't significantly better, keep previous
      if (prevDist - closest.dist < NODE_SWITCH_HYSTERESIS_M) {
        return {
          node: prevNode,
          distance: Math.round(prevDist),
          isReliable: prevDist <= MAX_NEARBY_DISTANCE_M,
          status: `Near ${prevNode.name}`,
        }
      }
    }
  }

  return {
    node: closest.node,
    distance: Math.round(closest.dist),
    isReliable: closest.dist <= MAX_NEARBY_DISTANCE_M,
    status: `Near ${closest.node.name}`,
  }
}

export function getCleanGpsStatus(gpsStatus, accuracy) {
  if (!gpsStatus) return { text: "Disconnected", state: "denied", accuracyText: "—" }

  const cleanText = gpsStatus.replace(/^[^\p{L}\p{N}]+/u, "").trim()
  const accuracyText = accuracy ? `±${Math.round(accuracy)} m` : "—"

  if (gpsStatus.includes("✅") || gpsStatus.toLowerCase().includes("active")) {
    return { text: "Connected", state: "good", accuracyText }
  }
  if (gpsStatus.includes("⚠️") || gpsStatus.toLowerCase().includes("weak") || gpsStatus.toLowerCase().includes("stale")) {
    return { text: cleanText || "Weak Signal", state: "weak", accuracyText }
  }
  if (gpsStatus.includes("⏳") || gpsStatus.toLowerCase().includes("requesting") || gpsStatus.toLowerCase().includes("searching")) {
    return { text: "Searching...", state: "locating", accuracyText }
  }

  return { text: cleanText || "Location Disabled", state: "denied", accuracyText }
}
