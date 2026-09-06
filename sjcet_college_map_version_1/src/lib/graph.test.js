import { describe, expect, it } from "vitest"
import { buildGraph, dijkstra, nearestNodeId, uniquePairs } from "./graph"

describe("graph helpers", () => {
  const testNodes = [
    { id: 1, pos: [9.0, 76.0] },
    { id: 2, pos: [9.0, 76.001] },
    { id: 3, pos: [9.001, 76.001] },
  ]

  it("deduplicates undirected edge pairs", () => {
    const out = uniquePairs([[1, 2], [2, 1], [2, 3]])
    expect(out).toEqual([[1, 2], [2, 3]])
  })

  it("builds graph and finds shortest path", () => {
    const graph = buildGraph(testNodes, [[1, 2], [2, 3], [1, 3]])
    const path = dijkstra(graph, 1, 3)
    expect(path[0]).toBe(1)
    expect(path[path.length - 1]).toBe(3)
  })

  it("returns nearest node with or without accuracy", () => {
    expect(nearestNodeId([9.0, 76.0], 10, testNodes)).toBe(1)
    expect(nearestNodeId([9.1, 76.1], null, testNodes)).not.toBeNull()
  })
})
