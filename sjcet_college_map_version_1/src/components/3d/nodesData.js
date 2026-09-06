/* ==========================================================================
   BUILDING NODES & NAVIGATION GRAPH DATA
   --------------------------------------------------------------------------
   This file contains all node positions, room numbers, descriptions, 
   entrances, staircases, and navigation graph generation logic.
   
   To edit room positions or numbers:
   - Modify the `rooms` array in `FLOOR_DEFS`.
   - x, y: Top-left SVG coordinates of the room.
   - w, h: Width and height of the room.
   - id: Room number / unique node ID.
   
   To edit entrances or staircases:
   - Modify `entrances` in `FLOOR_DEFS` or `STAIRS` array below.
   ========================================================================== */

/* ================= Floor Order ================= */
export const FLOOR_ORDER = ["ground", "first", "second"];

/* ================= Room Colors (Uniform Building Block Color) ================= */
export const WARM_ROOM_COLORS = {
  "101": "#3b82f6", "103": "#3b82f6", "104": "#3b82f6", "105": "#3b82f6",
  "110": "#3b82f6", "108": "#3b82f6", "106": "#3b82f6", "107": "#3b82f6",
  "202": "#3b82f6", "209": "#3b82f6", "208": "#3b82f6", "201": "#3b82f6",
  "207": "#3b82f6", "203": "#3b82f6", "204": "#3b82f6", "205": "#3b82f6", "206": "#3b82f6",
  "301": "#3b82f6", "308": "#3b82f6", "307": "#3b82f6", "302": "#3b82f6",
  "306": "#3b82f6", "303": "#3b82f6", "304": "#3b82f6", "305": "#3b82f6"
};

export const DARK_ROOM_COLORS = {
  "101": "#2563eb", "103": "#2563eb", "104": "#2563eb", "105": "#2563eb",
  "110": "#2563eb", "108": "#2563eb", "106": "#2563eb", "107": "#2563eb",
  "202": "#2563eb", "209": "#2563eb", "208": "#2563eb", "201": "#2563eb",
  "207": "#2563eb", "203": "#2563eb", "204": "#2563eb", "205": "#2563eb", "206": "#2563eb",
  "301": "#2563eb", "308": "#2563eb", "307": "#2563eb", "302": "#2563eb",
  "306": "#2563eb", "303": "#2563eb", "304": "#2563eb", "305": "#2563eb"
};

/* ================= Floor Definitions & Room Node Positions ================= */
export const FLOOR_DEFS = [
  {
    key: "ground",
    label: "Ground Floor",
    entrances: [
      { id: "ENT-L", x: 14, y: 430, name: "" },
      { id: "ENT-R", x: 626, y: 430, name: "" },
    ],
    rooms: [
      { id: "101", x: 30, y: 30, w: 220, h: 320, desc: "Lecture Hall" },
      { id: "103", x: 270, y: 30, w: 150, h: 170, desc: "Gents Waiting Room" },
      { id: "104", x: 440, y: 30, w: 170, h: 110, desc: "Gents Toilet" },
      { id: "105", x: 440, y: 150, w: 170, h: 300, desc: "Lecture Hall" },
      { id: "110", x: 30, y: 470, w: 220, h: 320, desc: "Lecture Hall" },
      { id: "108", x: 270, y: 620, w: 150, h: 170, desc: "Ladies Waiting Room" },
      { id: "106", x: 440, y: 470, w: 170, h: 220, desc: "Lecture Hall" },
      { id: "107", x: 440, y: 710, w: 170, h: 100, desc: "Ladies Toilet" },
    ],
  },
  {
    key: "first",
    label: "First Floor",
    entrances: [],
    rooms: [
      { id: "202", x: 30, y: 30, w: 180, h: 290, desc: "Faculty Room" },
      { id: "209", x: 30, y: 330, w: 180, h: 250, desc: "Machine Learning & Deep Learning Lab" },
      { id: "208", x: 30, y: 590, w: 180, h: 280, desc: "Lecture Hall" },
      { id: "201", x: 240, y: 30, w: 180, h: 230, desc: "Lecture Hall" },
      { id: "207", x: 240, y: 590, w: 180, h: 280, desc: "Department Library & Reprographic Centre" },
      { id: "203", x: 450, y: 30, w: 170, h: 250, desc: "Professor & Head" },
      { id: "204", x: 450, y: 290, w: 170, h: 220, desc: "Faculty Room" },
      { id: "205", x: 450, y: 520, w: 170, h: 210, desc: "Faculty Room" },
      { id: "206", x: 450, y: 740, w: 170, h: 140, desc: "HoD Room" },
    ],
  },
  {
    key: "second",
    label: "Second Floor",
    entrances: [],
    rooms: [
      { id: "301", x: 30, y: 30, w: 180, h: 260, desc: "Lecture Hall" },
      { id: "308", x: 30, y: 300, w: 180, h: 260, desc: "IEEE Room" },
      { id: "307", x: 30, y: 570, w: 180, h: 300, desc: "Lecture Hall" },
      { id: "302", x: 240, y: 30, w: 180, h: 260, desc: "Lecture Hall" },
      { id: "306", x: 240, y: 570, w: 180, h: 300, desc: "Research & Development Lab" },
      { id: "303", x: 450, y: 30, w: 170, h: 220, desc: "Department Library" },
      { id: "304", x: 450, y: 260, w: 170, h: 240, desc: "Lecture Hall" },
      { id: "305", x: 450, y: 700, w: 170, h: 170, desc: "Seminar Hall" },
    ],
  },
];

/* ================= Stair Nodes ================= */
export const STAIRS = [
  { key: "A", x: 320, y: 295, label: "Staircase 1" },
  { key: "B", x: 320, y: 545, label: "Staircase 2" },
];
export const STAIR_FLIGHT_COST = 240;

/* ================= Corridor Nodes Configuration =================
   Use this object to edit corridor aisle positions (x-coordinates),
   key horizontal corridor junction lines (y-coordinates), crossover lines,
   and waypoint density.
   ================================================================= */
export const CORRIDOR_CONFIG = {
  // Main vertical corridor aisle X positions
  leftCorridorX: 120,   // Left wing corridor aisle (X)
  rightCorridorX: 525,  // Right wing corridor aisle (X)
  middleCorridorX: 320, // Center aisle / stair crossover (X)

  // Primary horizontal corridor Y key-lines across floors
  corridorYPositions: [30, 150, 295, 430, 545, 710, 870],

  // Horizontal crossover corridor lines connecting Left, Middle, and Right aisles
  crossoverYPositions: [30, 150, 295, 430, 545, 710, 870],

  // Sub-waypoint density along vertical corridor aisles
  subWaypointSpacing: 35,
  maxGapBeforeSubWaypoints: 45,
};

/* ================= Layout & World Coordinate Transformation Constants ================= */
export const SCALE = 1 / 32;
export const CENTER = { x: 320, y: 450 };
export const FLOOR_H = 2.6;
export const FLOOR_GAP = 0.18;
export const FLOOR_BASE = FLOOR_DEFS.map((_, i) => i * (FLOOR_H + FLOOR_GAP));

export function toWorldX(svgX) { return (svgX - CENTER.x) * SCALE; }
export function toWorldZ(svgY) { return (svgY - CENTER.y) * SCALE; }
export function floorLabel(key) { return FLOOR_DEFS.find(f => f.key === key)?.label || key; }
export function floorIndex(key) { return FLOOR_ORDER.indexOf(key); }

/* ================= Navigation Graph & Node Structures ================= */
export const NODES = {};
export const ADJ = {};

function addNode(id, data) { NODES[id] = data; }
function addEdge(a, b, w) {
  if (!a || !b || a === b) return;
  const weight = w !== undefined ? w : svgDist(NODES[a], NODES[b]);
  ADJ[a] = ADJ[a] || [];
  if (!ADJ[a].some(e => e.to === b)) ADJ[a].push({ to: b, w: weight });
  ADJ[b] = ADJ[b] || [];
  if (!ADJ[b].some(e => e.to === a)) ADJ[b].push({ to: a, w: weight });
}
function svgDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Build the graph dynamically from floor definitions, staircases, and corridor lines
FLOOR_DEFS.forEach(floor => {
  const fKey = floor.key;
  const lcX = CORRIDOR_CONFIG.leftCorridorX;
  const rcX = CORRIDOR_CONFIG.rightCorridorX;
  const mcX = CORRIDOR_CONFIG.middleCorridorX;
  const corridorYs = new Set(CORRIDOR_CONFIG.corridorYPositions);

  // Entrance Nodes
  floor.entrances.forEach(e => {
    addNode(e.id, { x: e.x, y: e.y, floor: fKey, type: "entrance", label: e.name });
    const corrX = (e.x < lcX) ? lcX : rcX;
    const sideChar = (e.x < lcX) ? 'L' : 'R';
    const corrNodeId = `corr_${sideChar}_${e.y}_${fKey}`;
    addNode(corrNodeId, { x: corrX, y: e.y, floor: fKey, type: "corridor" });
    corridorYs.add(e.y);
    addEdge(e.id, corrNodeId);
  });

  // Room Nodes with Dedicated Door Threshold Waypoints
  floor.rooms.forEach(r => {
    const rx = r.x + r.w / 2;
    const ry = r.y + r.h / 2;
    addNode(r.id, { x: rx, y: ry, floor: fKey, type: "room", desc: r.desc });

    let corrX, sideChar, doorX;
    if (rx < lcX) {
      corrX = lcX; sideChar = 'L'; doorX = r.x + r.w;
    } else if (rx > rcX) {
      corrX = rcX; sideChar = 'R'; doorX = r.x;
    } else {
      if (Math.abs(rx - lcX) < Math.abs(rx - rcX)) {
        corrX = lcX; sideChar = 'L'; doorX = r.x;
      } else {
        corrX = rcX; sideChar = 'R'; doorX = r.x + r.w;
      }
    }

    const doorNodeId = `door_${r.id}_${fKey}`;
    addNode(doorNodeId, { x: doorX, y: ry, floor: fKey, type: "door" });
    addEdge(r.id, doorNodeId);

    const corrNodeId = `corr_${sideChar}_${ry}_${fKey}`;
    addNode(corrNodeId, { x: corrX, y: ry, floor: fKey, type: "corridor" });
    corridorYs.add(ry);
    addEdge(doorNodeId, corrNodeId);
  });

  // Staircase Landing Nodes
  STAIRS.forEach(s => {
    const stairNodeId = `${s.key}_${fKey}`;
    addNode(stairNodeId, { x: s.x, y: s.y, floor: fKey, type: "stair", label: s.label });

    const stairLNodeId = `corr_L_${s.y}_${fKey}`;
    const stairRNodeId = `corr_R_${s.y}_${fKey}`;
    const stairMNodeId = `corr_M_${s.y}_${fKey}`;

    addNode(stairLNodeId, { x: lcX, y: s.y, floor: fKey, type: "corridor" });
    addNode(stairRNodeId, { x: rcX, y: s.y, floor: fKey, type: "corridor" });
    addNode(stairMNodeId, { x: mcX, y: s.y, floor: fKey, type: "corridor" });

    corridorYs.add(s.y);
    addEdge(stairNodeId, stairMNodeId);
    addEdge(stairMNodeId, stairLNodeId);
    addEdge(stairMNodeId, stairRNodeId);
  });

  // Sub-waypoint nodes every subWaypointSpacing units along vertical corridor aisles
  const yList = Array.from(corridorYs).sort((a, b) => a - b);
  const denseYs = [];
  const spacing = CORRIDOR_CONFIG.subWaypointSpacing || 35;
  const maxGap = CORRIDOR_CONFIG.maxGapBeforeSubWaypoints || 45;

  for (let i = 0; i < yList.length - 1; i++) {
    const y1 = yList[i], y2 = yList[i + 1];
    denseYs.push(y1);
    const gap = y2 - y1;
    if (gap > maxGap) {
      const step = gap / Math.ceil(gap / spacing);
      for (let sy = y1 + step; sy < y2 - 5; sy += step) {
        denseYs.push(Math.round(sy));
      }
    }
  }
  denseYs.push(yList[yList.length - 1]);

  const sortedDenseYs = Array.from(new Set(denseYs)).sort((a, b) => a - b);
  sortedDenseYs.forEach(y => {
    addNode(`corr_L_${y}_${fKey}`, { x: lcX, y, floor: fKey, type: "corridor" });
    addNode(`corr_R_${y}_${fKey}`, { x: rcX, y, floor: fKey, type: "corridor" });
  });

  // Connect sequential vertical corridor nodes along Left & Right wings
  for (let i = 0; i < sortedDenseYs.length - 1; i++) {
    const y1 = sortedDenseYs[i], y2 = sortedDenseYs[i + 1];
    addEdge(`corr_L_${y1}_${fKey}`, `corr_L_${y2}_${fKey}`);
    addEdge(`corr_R_${y1}_${fKey}`, `corr_R_${y2}_${fKey}`);
  }

  // Connect horizontal crossover corridors at key junction points
  const crossYs = CORRIDOR_CONFIG.crossoverYPositions;
  crossYs.forEach(y => {
    addNode(`corr_L_${y}_${fKey}`, { x: lcX, y, floor: fKey, type: "corridor" });
    addNode(`corr_M_${y}_${fKey}`, { x: mcX, y, floor: fKey, type: "corridor" });
    addNode(`corr_R_${y}_${fKey}`, { x: rcX, y, floor: fKey, type: "corridor" });

    addEdge(`corr_L_${y}_${fKey}`, `corr_M_${y}_${fKey}`);
    addEdge(`corr_M_${y}_${fKey}`, `corr_R_${y}_${fKey}`);
  });
});

// Vertical multi-floor stair connections
for (let i = 0; i < FLOOR_ORDER.length - 1; i++) {
  const f1 = FLOOR_ORDER[i], f2 = FLOOR_ORDER[i + 1];
  STAIRS.forEach(s => addEdge(`${s.key}_${f1}`, `${s.key}_${f2}`, STAIR_FLIGHT_COST));
}

/* ================= Graph Search & Step Generation Helpers ================= */
export function dijkstra(start, end) {
  const dist = {}, prev = {};
  Object.keys(NODES).forEach(id => (dist[id] = Infinity));
  dist[start] = 0;
  const pending = new Set(Object.keys(NODES));
  while (pending.size) {
    let u = null, best = Infinity;
    pending.forEach(id => { if (dist[id] < best) { best = dist[id]; u = id; } });
    if (u === null) break;
    pending.delete(u);
    if (u === end) break;
    (ADJ[u] || []).forEach(edge => {
      if (!pending.has(edge.to)) return;
      const alt = dist[u] + edge.w;
      if (alt < dist[edge.to]) { dist[edge.to] = alt; prev[edge.to] = u; }
    });
  }
  if (dist[end] === Infinity) return null;
  const path = [end];
  let cur = end;
  while (cur !== start) { cur = prev[cur]; path.unshift(cur); }
  return { path, distance: Math.round(dist[end]) };
}

export function getNearestStairKey(nodeId) {
  const node = NODES[nodeId];
  if (!node) return "A";
  const distToA = Math.hypot(node.x - 320, node.y - 295);
  const distToB = Math.hypot(node.x - 320, node.y - 545);
  return distToA < distToB ? "A" : "B";
}

export function getStairDirection(nodeId, stairKey) {
  const node = NODES[nodeId];
  if (!node) return "";
  const stair = STAIRS.find(s => s.key === stairKey);
  if (!stair) return "";
  return node.x < stair.x ? "Right" : "Left";
}

export function buildSteps(path) {
  const steps = [];
  const first = NODES[path[0]];
  const firstName = first.type === "room" ? `Room ${path[0]} (${first.desc})` : first.label;
  const stairKey = getNearestStairKey(path[0]);
  const nearestStair = stairKey === "A" ? "Staircase 1" : "Staircase 2";
  const direction = getStairDirection(path[0], stairKey);
  steps.push({
    title: `Start at ${firstName}`,
    detail: `${floorLabel(first.floor)} · ${nearestStair} on your ${direction.toLowerCase()}`
  });

  let stairFlightsCount = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = NODES[path[i - 1]], cur = NODES[path[i]];
    if (cur.type === "stair" && prev.type !== "stair") {
      const startNode = NODES[path[0]];
      const dirText = startNode.x < 320 ? "on your right" : "on your left";
      steps.push({ title: `Walk to ${cur.label}`, detail: `${floorLabel(cur.floor)} ${dirText}` });
    } else if (cur.type === "stair" && prev.type === "stair" && cur.floor === prev.floor) {
      steps.push({ title: `Cross corridor to ${cur.label}`, detail: `${floorLabel(cur.floor)}` });
    } else if (cur.type === "stair" && prev.type === "stair" && cur.floor !== prev.floor) {
      const up = floorIndex(cur.floor) > floorIndex(prev.floor);
      stairFlightsCount++;
      steps.push({ title: `Take ${cur.label} ${up ? "UP ⬆" : "DOWN ⬇"}`, detail: `Move to ${floorLabel(cur.floor)}` });
    } else if (cur.type === "room") {
      steps.push({ title: `Arrive at Room ${path[i]}`, detail: `${cur.desc} (${floorLabel(cur.floor)})` });
    } else if (cur.type === "entrance") {
      steps.push({ title: `Exit via ${cur.label}`, detail: `${floorLabel(cur.floor)}` });
    }
  }
  return { steps, stairFlightsCount };
}
