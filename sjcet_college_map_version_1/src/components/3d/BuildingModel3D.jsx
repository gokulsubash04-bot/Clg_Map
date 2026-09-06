import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./BuildingModel3D.css";

import {
  FLOOR_ORDER,
  WARM_ROOM_COLORS,
  DARK_ROOM_COLORS,
  FLOOR_DEFS,
  STAIRS,
  STAIR_FLIGHT_COST,
  SCALE,
  CENTER,
  FLOOR_H,
  FLOOR_GAP,
  FLOOR_BASE,
  toWorldX,
  toWorldZ,
  floorLabel,
  floorIndex,
  NODES,
  ADJ,
  dijkstra,
  getNearestStairKey,
  getStairDirection,
  buildSteps
} from "./nodesData";
import { buildBlenderBuildingShell } from "./BlenderBuildingModel";
import { useGPS } from "../../hooks/useGPS";
import { haversineMeters } from "../../lib/geo";

/* ================= 3D Sprite Label Helper ================= */
function makeTextSprite(text, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 52px 'Outfit', sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.4, 0.7, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function makeTitleHeaderSprite(text, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 44px 'Outfit', sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.5, 1.38, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function convertGpsTo3DWorld([lat, lng]) {
  const spbLat = 9.7272695253, spbLng = 76.725929907;
  const dLatMeters = (lat - spbLat) * 111320;
  const dLngMeters = (lng - spbLng) * (111320 * Math.cos(spbLat * Math.PI / 180));

  const worldX = dLngMeters * 0.85;
  const worldZ = -dLatMeters * 0.85;
  return { x: worldX, z: worldZ };
}

/* ================= SEARCHABLE COMBORDINATE SELECT COMPONENT ================= */
function SearchableSelect({ value, onChange, searchCategory, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  // Compute all available items from FLOOR_DEFS
  const allItems = React.useMemo(() => {
    const items = [];
    FLOOR_DEFS.forEach(floor => {
      floor.entrances.forEach(e => {
        items.push({
          id: e.id,
          name: e.name,
          displayText: e.name,
          label: `🚪 ${e.name}`,
          floorKey: floor.key,
          floorLabel: floor.label,
          type: "entrance",
          searchText: `${e.id} ${e.name} ${floor.label}`.toLowerCase()
        });
      });
      floor.rooms.forEach(r => {
        items.push({
          id: r.id,
          name: `Room ${r.id} — ${r.desc}`,
          displayText: `Room ${r.id} — ${r.desc}`,
          label: `📍 Room ${r.id} — ${r.desc}`,
          floorKey: floor.key,
          floorLabel: floor.label,
          type: "room",
          desc: r.desc,
          searchText: `${r.id} ${r.desc} ${floor.label}`.toLowerCase()
        });
      });
    });
    return items;
  }, []);

  // Get current selected item display label
  const selectedItem = allItems.find(item => item.id === value);
  const displayValue = selectedItem ? selectedItem.displayText : value;

  // Filter items based on category and search query
  const filteredItems = React.useMemo(() => {
    return allItems.filter(item => {
      // Category filter
      if (searchCategory !== "all") {
        if (item.type === "entrance") {
          if (searchCategory !== "entrances") return false;
        } else {
          const desc = item.desc ? item.desc.toLowerCase() : "";
          if (searchCategory === "halls" && !desc.includes("hall") && !desc.includes("lecture")) return false;
          if (searchCategory === "labs" && !desc.includes("lab") && !desc.includes("centre")) return false;
          if (searchCategory === "faculty" && !desc.includes("faculty") && !desc.includes("head") && !desc.includes("hod") && !desc.includes("professor")) return false;
          if (searchCategory === "toilets" && !desc.includes("toilet") && !desc.includes("waiting")) return false;
        }
      }

      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return item.searchText.includes(q);
    });
  }, [allItems, searchCategory, query]);

  // Reset highlight index on query/category change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, searchCategory]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setIsOpen(true);

    // Auto-select if user types exact ID (e.g., "205" or "ENT-L")
    const exactMatch = allItems.find(
      item => item.id.toLowerCase() === text.trim().toLowerCase()
    );
    if (exactMatch) {
      onChange(exactMatch.id);
    }
  };

  const handleSelectOption = (item) => {
    onChange(item.id);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    if (inputRef.current) inputRef.current.focus();
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        const itemToSelect = filteredItems[highlightedIndex] || filteredItems[0];
        handleSelectOption(itemToSelect);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className="searchable-input-wrapper">
        <span className="search-icon-left">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="searchable-input"
          value={isOpen ? query : displayValue}
          onFocus={() => {
            setIsOpen(true);
            setQuery("");
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type location ID, room or name..."}
          autoComplete="off"
        />
        {query ? (
          <span className="search-clear-btn" onClick={handleClear} title="Clear search text">
            ✕
          </span>
        ) : (
          <span
            className={`toggle-arrow-right ${isOpen ? "open" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            ▼
          </span>
        )}
      </div>

      {isOpen && (
        <div className="searchable-dropdown">
          {filteredItems.length === 0 ? (
            <div className="searchable-no-results">
              No matching locations found for "<strong>{query}</strong>"
            </div>
          ) : (
            FLOOR_DEFS.map(floor => {
              const floorItems = filteredItems.filter(item => item.floorKey === floor.key);
              if (floorItems.length === 0) return null;

              return (
                <div key={floor.key}>
                  <div className="searchable-group-label">{floor.label}</div>
                  {floorItems.map(item => {
                    const globalIdx = filteredItems.indexOf(item);
                    const isSelected = value === item.id;
                    const isHighlighted = highlightedIndex === globalIdx;

                    return (
                      <div
                        key={item.id}
                        ref={el => (optionRefs.current[globalIdx] = el)}
                        className={`searchable-option ${isSelected ? "selected" : ""} ${isHighlighted ? "highlighted" : ""}`}
                        onMouseEnter={() => setHighlightedIndex(globalIdx)}
                        onClick={() => handleSelectOption(item)}
                      >
                        <span>{item.label}</span>
                        <span className="option-floor-badge">{item.floorLabel}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function BuildingModel3D({ targetBuilding = "SPB", onSwitchBuilding, onGoHome }) {
  const mountRef = useRef(null);
  const threeRef = useRef({});
  const [visibleFloor, setVisibleFloor] = useState("all");
  const [selected, setSelected] = useState(null);
  const [fromId, setFromId] = useState("ENT-L");
  const [toId, setToId] = useState("205");
  const [steps, setSteps] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [searchCategory, setSearchCategory] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("route");
  const [themeMode, setThemeMode] = useState("warm");
  const [cameraPreset, setCameraPreset] = useState("front");
  const [showNodes, setShowNodes] = useState(false); // Default hide node visualizer for visitors
  const [showShell, setShowShell] = useState(true); // Default show exterior Blender building shell

  const { userLocation, gpsStatus, gpsAccuracy } = useGPS();
  const [gpsFollow, setGpsFollow] = useState(true);
  const [gpsBuildingDistance, setGpsBuildingDistance] = useState(null);

  const visibleFloorRef = useRef(visibleFloor);
  visibleFloorRef.current = visibleFloor;

  // Live GPS Tracking & Building Focus Effect
  useEffect(() => {
    if (threeRef.current) {
      threeRef.current.userGpsPos = userLocation;
    }

    if (!userLocation || !gpsFollow) return;
    const SPB_POS = [9.7272695253, 76.725929907];
    const SJPB_POS = [9.7266064690, 76.726404863];

    const dSPB = haversineMeters(userLocation, SPB_POS);
    const dSJPB = haversineMeters(userLocation, SJPB_POS);

    if (dSPB < dSJPB) {
      setGpsBuildingDistance({ name: "St. Peter's Block", dist: dSPB });
      if (targetBuilding !== "SPB") {
        onSwitchBuilding?.("SPB");
      }
    } else {
      setGpsBuildingDistance({ name: "St. John Paul Block", dist: dSJPB });
      if (targetBuilding !== "SJPB") {
        onSwitchBuilding?.("SJPB");
      }
    }
  }, [userLocation, gpsFollow, targetBuilding, onSwitchBuilding]);

  /* Three.js Engine Setup */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth, height = mount.clientHeight;

    let bgColor, groundColor, slabColor, ambientColor, sunColor, roomColorMap, tubeColor, columnColor;
    bgColor = "#bae6fd"; // Soft horizon blue fog color
    groundColor = "#224c1c";
    slabColor = themeMode === "warm" ? "#fef08a" : "#334155";
    ambientColor = "#ffffff";
    sunColor = "#fff4e6";
    roomColorMap = themeMode === "warm" ? WARM_ROOM_COLORS : DARK_ROOM_COLORS;
    tubeColor = "#06b6d4";
    columnColor = themeMode === "warm" ? "#fef3c7" : "#cbd5e1";

    const scene = new THREE.Scene();

    // Mixed Blue Sky Background Texture
    function createSkyTexture() {
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, "#1d4ed8");   // Deep blue sky zenith
      grad.addColorStop(0.35, "#3b82f6"); // Vibrant azure blue
      grad.addColorStop(0.70, "#60a5fa"); // Soft sky blue
      grad.addColorStop(1.00, "#bae6fd"); // Bright horizon blue
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    }

    scene.background = createSkyTexture();
    scene.fog = new THREE.Fog("#bae6fd", 60, 320);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(ambientColor, themeMode === "warm" ? 0.85 : 0.85);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(sunColor, themeMode === "warm" ? 0.95 : 0.85);
    sun.position.set(18, 26, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(themeMode === "warm" ? "#fecdd3" : "#34d399", 0.35);
    fill.position.set(-14, 12, -12);
    scene.add(fill);

    // Full Infinite Green Campus Landscape Ground
    const grandLawn = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: "#255622", roughness: 0.95, metalness: 0.02 })
    );
    grandLawn.rotation.x = -Math.PI / 2;
    grandLawn.position.set(0, -0.22, -40);
    grandLawn.receiveShadow = true;
    scene.add(grandLawn);

    // 1. Primary 3D Exterior Building Shell (St Peter's Block - South at Z = 0)
    const shellGroup = buildBlenderBuildingShell("ST. PETER'S BLOCK");
    scene.add(shellGroup);

    // 2. Separate Twin Building Shell (St John Paul Block - North at Z = -80, Rotated 180° facing across wider courtyard)
    const oppositeShellGroup = buildBlenderBuildingShell("ST. JOHN PAUL BLOCK");
    oppositeShellGroup.position.set(0, 0, -80);
    oppositeShellGroup.rotation.y = Math.PI;
    scene.add(oppositeShellGroup);

    // 3D Main Building Title Header Labels floating above both building roof peaks
    const buildingTitleSprite = makeTitleHeaderSprite("St Peter's Block", themeMode === "warm" ? "#fef08a" : "#38bdf8");
    buildingTitleSprite.position.set(0, 13.8, 0);
    scene.add(buildingTitleSprite);

    const oppTitleSprite = makeTitleHeaderSprite("St John Paul Block", themeMode === "warm" ? "#fef08a" : "#38bdf8");
    oppTitleSprite.position.set(0, 13.8, -80);
    scene.add(oppTitleSprite);

    // 3. Simple Pathway with Building-Matching Colors & Thinner Width (Width: 3.0, Length: 48)
    const campusWalkwayGroup = new THREE.Group();
    scene.add(campusWalkwayGroup);

    const borderMat = new THREE.MeshStandardMaterial({ color: "#8c3a4a", roughness: 0.5, metalness: 0.1 });
    const whitePathMat = new THREE.MeshStandardMaterial({ color: "#eddcc6", roughness: 0.35, metalness: 0.1 });

    // Main Path Center Strip matching building cream sandstone (Connecting Z = -17.5 to Z = -62.5 across central courtyard at Z = -40)
    const pathWhite = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.04, 48), whitePathMat);
    pathWhite.position.set(0, -0.06, -40);
    pathWhite.receiveShadow = true;
    campusWalkwayGroup.add(pathWhite);

    // Left & Right Building-Matching Border Strips
    const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 48), borderMat);
    leftBorder.position.set(-1.7, -0.05, -40);
    leftBorder.receiveShadow = true;

    const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 48), borderMat);
    rightBorder.position.set(1.7, -0.05, -40);
    rightBorder.receiveShadow = true;

    campusWalkwayGroup.add(leftBorder, rightBorder);

    // 4. Compact Center Hexagon-Shaped Courtyard Plaza between the two buildings (at Z = -40)
    const hexPlazaGroup = new THREE.Group();
    hexPlazaGroup.position.set(0, -0.04, -40);
    scene.add(hexPlazaGroup);

    // Outer Hexagonal Border Edge matching building trim
    const hexBrownEdge = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7, 2.7, 0.10, 6),
      borderMat
    );
    hexBrownEdge.position.y = 0.04;
    hexPlazaGroup.add(hexBrownEdge);

    // Hexagonal Stone Courtyard Surface matching building cream
    const hexWhitePlaza = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.12, 6),
      whitePathMat
    );
    hexWhitePlaza.position.y = 0.07;
    hexPlazaGroup.add(hexWhitePlaza);

    // Inner Hexagonal Green Grass Island
    const hexGreenIsland = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: "#2d5a27", roughness: 0.9 })
    );
    hexGreenIsland.position.y = 0.10;
    hexPlazaGroup.add(hexGreenIsland);

    // Animated Central Water Fountain in Hexagon Plaza Center
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(0, 0.12, 0);
    hexPlazaGroup.add(fountainGroup);

    const basinRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.1, 0.20, 6),
      new THREE.MeshStandardMaterial({ color: columnColor, roughness: 0.6, metalness: 0.2 })
    );
    basinRing.position.y = 0.15;
    fountainGroup.add(basinRing);

    const waterPool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.18, 6),
      new THREE.MeshStandardMaterial({
        color: "#0284c7", emissive: "#0369a1", emissiveIntensity: 0.4,
        roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.85
      })
    );
    waterPool.position.y = 0.16;
    fountainGroup.add(waterPool);

    const spoutPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.28, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: columnColor, roughness: 0.4 })
    );
    spoutPillar.position.y = 0.28;
    fountainGroup.add(spoutPillar);

    const waterSpray = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.8, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: "#7dd3fc", emissive: "#38bdf8", emissiveIntensity: 0.9,
        transparent: true, opacity: 0.6, side: THREE.DoubleSide
      })
    );
    waterSpray.position.y = 0.7;
    fountainGroup.add(waterSpray);

    const roomMeshMap = {};
    const entranceMeshMap = {};
    const stairMeshMap = {};
    const floorGroups = {};

    FLOOR_DEFS.forEach((floor, fi) => {
      const group = new THREE.Group();
      floorGroups[floor.key] = group;
      scene.add(group);
      const base = FLOOR_BASE[fi];

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      floor.rooms.forEach(r => {
        minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x + r.w);
        minY = Math.min(minY, r.y); maxY = Math.max(maxY, r.y + r.h);
      });
      const pad = 14;
      const slabW = (maxX - minX + pad * 2) * SCALE;
      const slabD = (maxY - minY + pad * 2) * SCALE;
      const slabCx = toWorldX((minX + maxX) / 2), slabCz = toWorldZ((minY + maxY) / 2);

      // Transparent Architectural Floor Slab Beam
      const slabMat = new THREE.MeshStandardMaterial({
        color: columnColor,
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(slabW, 0.14, slabD),
        slabMat
      );
      slab.position.set(slabCx, base, slabCz);
      slab.receiveShadow = true; slab.castShadow = true;
      group.add(slab);

      // Floor Slab Outline Edge
      const slabEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(slabW, 0.14, slabD));
      const slabLineMat = new THREE.LineBasicMaterial({
        color: columnColor,
        transparent: true,
        opacity: 0.6
      });
      const slabLine = new THREE.LineSegments(slabEdges, slabLineMat);
      slabLine.position.copy(slab.position);
      group.add(slabLine);

      // Cream Horizontal Floor Moldings (Transparent)
      const trimMat = new THREE.MeshStandardMaterial({
        color: columnColor,
        roughness: 0.3,
        metalness: 0.3,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      });
      const trim = new THREE.Mesh(new THREE.BoxGeometry(slabW + 0.1, 0.08, slabD + 0.1), trimMat);
      trim.position.set(slabCx, base + 0.07, slabCz);
      group.add(trim);

      // Top Floor Roof Ceiling Slab & Molding (Upper Panel for Top Floor)
      if (fi === FLOOR_DEFS.length - 1) {
        const topRoofY = base + FLOOR_H;

        const topSlab = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.14, slabD), slabMat);
        topSlab.position.set(slabCx, topRoofY, slabCz);
        topSlab.receiveShadow = true; topSlab.castShadow = true;
        group.add(topSlab);

        const topSlabEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(slabW, 0.14, slabD));
        const topSlabLine = new THREE.LineSegments(topSlabEdges, slabLineMat);
        topSlabLine.position.copy(topSlab.position);
        group.add(topSlabLine);

        const topTrim = new THREE.Mesh(new THREE.BoxGeometry(slabW + 0.1, 0.08, slabD + 0.1), trimMat);
        topTrim.position.set(slabCx, topRoofY + 0.07, slabCz);
        group.add(topTrim);
      }

      // Vertical Structural Support Columns (Building Pillars)
      if (fi > 0) {
        const pillarMat = new THREE.MeshStandardMaterial({ color: columnColor, roughness: 0.4, metalness: 0.2 });
        [-slabW / 2 + 0.5, slabW / 2 - 0.5].forEach(px => {
          [-slabD / 2 + 0.5, slabD / 2 - 0.5].forEach(pz => {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, FLOOR_H, 12), pillarMat);
            pillar.position.set(slabCx + px, base - FLOOR_H / 2, slabCz + pz);
            pillar.castShadow = true;
            group.add(pillar);
          });
        });
      }

      // Corridor Glass Balustrade Railings for Upper Floors
      if (fi > 0) {
        const railingGlassMat = new THREE.MeshStandardMaterial({
          color: "#38bdf8", transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.8
        });
        const railingCapMat = new THREE.MeshStandardMaterial({ color: columnColor, roughness: 0.3, metalness: 0.7 });
        const railing = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.45, 0.04), railingGlassMat);
        railing.position.set(slabCx, base + 0.3, slabCz + slabD / 2);
        const railingCap = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.05, 0.06), railingCapMat);
        railingCap.position.set(slabCx, base + 0.53, slabCz + slabD / 2);
        group.add(railing, railingCap);
      }

      const roomH = FLOOR_H * 0.8;

      floor.rooms.forEach(r => {
        const w = r.w * SCALE, d = r.h * SCALE;
        const cx = toWorldX(r.x + r.w / 2), cz = toWorldZ(r.y + r.h / 2);
        const geo = new THREE.BoxGeometry(w, roomH, d);

        const roomColor = roomColorMap[r.id] || "#a83232";
        const mat = new THREE.MeshStandardMaterial({ color: roomColor, roughness: 0.5, metalness: 0.1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, base + 0.07 + roomH / 2, cz);
        mesh.castShadow = true; mesh.receiveShadow = true;
        group.add(mesh);

        // Realistic Room Door ONLY on the Inside Corridor-Facing Wall
        const doorFrameMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.6, metalness: 0.2 });
        const doorPanelMat = new THREE.MeshStandardMaterial({ color: "#78350f", roughness: 0.4, metalness: 0.1 });
        const doorHandleMat = new THREE.MeshStandardMaterial({ color: "#f59e0b", metalness: 0.9, roughness: 0.1 });

        let doorWallSide;
        if (r.x <= 50) {
          doorWallSide = 'right'; // Left wing rooms put door on right wall (+X) facing inner corridor
        } else if (r.x >= 400) {
          doorWallSide = 'left';  // Right wing rooms put door on left wall (-X) facing inner corridor
        } else {
          doorWallSide = (r.x + r.w / 2) < 320 ? 'left' : 'right';
        }

        const doorX = doorWallSide === 'left' ? cx - w / 2 - 0.01 : cx + w / 2 + 0.01;
        const doorY = base + 0.07 + (roomH * 0.65) / 2;

        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, roomH * 0.68, 0.42), doorFrameMat);
        doorFrame.position.set(doorX, doorY, cz);

        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, roomH * 0.64, 0.38), doorPanelMat);
        doorPanel.position.set(doorX, doorY, cz);

        const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), doorHandleMat);
        doorHandle.position.set(doorX + (doorWallSide === 'left' ? -0.03 : 0.03), base + 0.07 + (roomH * 0.35), cz + 0.12);

        group.add(doorFrame, doorPanel, doorHandle);

        // Room wireframe edges
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: "rgba(255,255,255,0.7)" }));
        line.position.copy(mesh.position);
        group.add(line);

        const label = makeTextSprite(r.id, "#ffffff");
        label.position.set(cx, base + roomH + 0.35, cz);
        group.add(label);

        roomMeshMap[r.id] = { mesh, line, label, floorKey: floor.key, desc: r.desc, baseColor: roomColor };
      });

      floor.entrances.forEach(e => {
        const cx = toWorldX(e.x), cz = toWorldZ(e.y);
        const entColor = themeMode === "warm" ? "#8c3a4a" : "#10b981";
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.28, 0.65, 16),
          new THREE.MeshStandardMaterial({ color: entColor, emissive: entColor, emissiveIntensity: 0.75 })
        );
        cone.position.set(cx, base + 0.35, cz);
        group.add(cone);

        const label = makeTextSprite(e.name, entColor);
        label.scale.set(1.6, 0.8, 1);
        label.position.set(cx, base + 1.6, cz);
        group.add(label);

        entranceMeshMap[e.id] = { cone, label, floorKey: floor.key, baseColor: entColor };
      });
    });

    // REAL 3D Staircase Models with Physical Steps, Handrails, and Architectural Glass Enclosure
    const towerHeight = FLOOR_BASE[FLOOR_BASE.length - 1] + FLOOR_H + 0.1;
    STAIRS.forEach(s => {
      const sx = toWorldX(s.x), sz = toWorldZ(s.y);
      const towerColor = themeMode === "warm" ? "#8c3a4a" : "#38bdf8";

      const stairGroup = new THREE.Group();
      stairGroup.position.set(sx, 0, sz);
      scene.add(stairGroup);

      // 1. Central Core Metal Pillar
      const coreCol = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, towerHeight, 16),
        new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.8, roughness: 0.2 })
      );
      coreCol.position.set(0, towerHeight / 2, 0);
      stairGroup.add(coreCol);

      // 2. Physical 3D Step Treads & Handrails for each floor flight
      const stepMat = new THREE.MeshStandardMaterial({
        color: themeMode === "warm" ? "#78350f" : "#334155",
        roughness: 0.3,
        metalness: 0.2
      });
      const handrailMat = new THREE.MeshStandardMaterial({
        color: themeMode === "warm" ? "#d97706" : "#38bdf8",
        metalness: 0.9,
        roughness: 0.1
      });

      const stepsPerFlight = 14;
      const handrailPoints = [];

      for (let fi = 0; fi < FLOOR_BASE.length - 1; fi++) {
        const startY = FLOOR_BASE[fi] + 0.07;
        const endY = FLOOR_BASE[fi + 1] + 0.07;
        const flightH = endY - startY;

        for (let i = 0; i < stepsPerFlight; i++) {
          const t = i / stepsPerFlight;
          const y = startY + t * flightH;
          const angle = fi * Math.PI + i * (Math.PI * 1.5 / stepsPerFlight);

          const stepMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.72, 0.05, 0.28),
            stepMat
          );
          const radius = 0.42;
          const stepX = Math.cos(angle) * radius;
          const stepZ = Math.sin(angle) * radius;
          stepMesh.position.set(stepX, y, stepZ);
          stepMesh.rotation.y = -angle + Math.PI / 2;
          stepMesh.castShadow = true;
          stepMesh.receiveShadow = true;
          stairGroup.add(stepMesh);

          // Vertical Baluster post for handrail
          const baluster = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.55, 8),
            handrailMat
          );
          const outerR = radius + 0.28;
          const hX = Math.cos(angle) * outerR;
          const hZ = Math.sin(angle) * outerR;
          baluster.position.set(hX, y + 0.275, hZ);
          stairGroup.add(baluster);

          handrailPoints.push(new THREE.Vector3(hX, y + 0.55, hZ));
        }

        // Floor Landing Platform
        const landing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.82, 0.82, 0.08, 16, 1, false, fi * Math.PI, Math.PI),
          stepMat
        );
        landing.position.set(0, endY, 0);
        stairGroup.add(landing);
      }

      // Continuous Helical Handrail Tube
      if (handrailPoints.length > 2) {
        const handrailCurve = new THREE.CatmullRomCurve3(handrailPoints);
        const handrailGeo = new THREE.TubeGeometry(handrailCurve, 64, 0.025, 8, false);
        const handrailMesh = new THREE.Mesh(handrailGeo, handrailMat);
        stairGroup.add(handrailMesh);
      }

      // 3. Octagonal Glass Tower Enclosure with Steel Corner Posts
      const towerGeo = new THREE.CylinderGeometry(0.85, 0.85, towerHeight, 8, 1, true);
      const towerMat = new THREE.MeshStandardMaterial({
        color: towerColor, transparent: true, opacity: 0.28, side: THREE.DoubleSide, roughness: 0.1, emissive: towerColor, emissiveIntensity: 0.2
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(sx, towerHeight / 2, sz);
      scene.add(tower);

      const towerLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.85, 0.85, towerHeight, 8, 4)),
        new THREE.LineBasicMaterial({ color: towerColor, transparent: true, opacity: 0.6 })
      );
      towerLine.position.copy(tower.position);
      scene.add(towerLine);

      // Steel Corner Posts
      for (let c = 0; c < 8; c++) {
        const cAngle = c * (Math.PI * 2 / 8);
        const px = sx + Math.cos(cAngle) * 0.85;
        const pz = sz + Math.sin(cAngle) * 0.85;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, towerHeight, 8),
          new THREE.MeshStandardMaterial({ color: "#334155", metalness: 0.8 })
        );
        post.position.set(px, towerHeight / 2, pz);
        scene.add(post);
      }

      const towerLabel = makeTextSprite(s.label, towerColor);
      towerLabel.position.set(sx, towerHeight + 0.4, sz);
      scene.add(towerLabel);

      stairMeshMap[s.key] = { tower, towerLine, label: towerLabel, stairGroup, sx, sz };
    });

    /* ================= 3D Node & Edge Visualizer Overlay ================= */
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    const nodeColorMap = {
      room: "#3b82f6",     // Blue
      door: "#06b6d4",     // Cyan
      corridor: "#10b981", // Emerald Green
      stair: "#a855f7",    // Purple
      entrance: "#f59e0b"  // Gold / Yellow
    };

    const edgeLinesPoints = [];

    Object.entries(NODES).forEach(([id, data]) => {
      const fi = floorIndex(data.floor);
      const base = FLOOR_BASE[fi];
      const wx = toWorldX(data.x);
      const wz = toWorldZ(data.y);
      const wy = base + 0.2;

      const nodeColor = nodeColorMap[data.type] || "#ffffff";
      const radiusSize = data.type === "room" ? 0.16 : (data.type === "door" ? 0.12 : 0.09);
      const nodeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(radiusSize, 12, 12),
        new THREE.MeshStandardMaterial({
          color: nodeColor,
          emissive: nodeColor,
          emissiveIntensity: 0.9,
          roughness: 0.2
        })
      );
      nodeMesh.position.set(wx, wy, wz);
      nodesGroup.add(nodeMesh);

      // Graph edges connecting lines
      (ADJ[id] || []).forEach(edge => {
        const targetNode = NODES[edge.to];
        if (targetNode) {
          const tfi = floorIndex(targetNode.floor);
          const tbase = FLOOR_BASE[tfi];
          const twx = toWorldX(targetNode.x);
          const twz = toWorldZ(targetNode.y);
          const twy = tbase + 0.2;

          edgeLinesPoints.push(new THREE.Vector3(wx, wy, wz));
          edgeLinesPoints.push(new THREE.Vector3(twx, twy, twz));
        }
      });
    });

    const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgeLinesPoints);
    const edgeMat = new THREE.LineBasicMaterial({
      color: "#10b981",
      transparent: true,
      opacity: 0.35
    });
    const edgeLinesMesh = new THREE.LineSegments(edgeGeo, edgeMat);
    nodesGroup.add(edgeLinesMesh);

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);

    const pathMarkerGroup = new THREE.Group();

    const pathMarkerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 24),
      new THREE.MeshStandardMaterial({
        color: "#ffea00",
        emissive: "#ffea00",
        emissiveIntensity: 2.2,
        roughness: 0.1,
        metalness: 0.8
      })
    );

    const pathMarkerHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16),
      new THREE.MeshStandardMaterial({
        color: "#facc15",
        emissive: "#facc15",
        emissiveIntensity: 1.6,
        transparent: true,
        opacity: 0.45
      })
    );

    pathMarkerGroup.add(pathMarkerSphere, pathMarkerHalo);
    pathMarkerGroup.visible = false;
    scene.add(pathMarkerGroup);

    // 3D Selected Room Holographic Beacon Beam
    const beaconGroup = new THREE.Group();
    scene.add(beaconGroup);

    const beaconCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.45, 3.8, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: "#38bdf8", emissive: "#38bdf8", emissiveIntensity: 1.5,
        transparent: true, opacity: 0.6, side: THREE.DoubleSide
      })
    );
    beaconGroup.add(beaconCylinder);

    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.65, 32),
      new THREE.MeshStandardMaterial({
        color: "#38bdf8", emissive: "#38bdf8", emissiveIntensity: 1.8,
        transparent: true, opacity: 0.85, side: THREE.DoubleSide
      })
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconGroup.add(beaconRing);

    // 3D Live GPS User Location Marker Group
    const gpsUserGroup = new THREE.Group();
    scene.add(gpsUserGroup);

    const gpsPinCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 24, 24),
      new THREE.MeshStandardMaterial({
        color: "#1a73e8", emissive: "#1a73e8", emissiveIntensity: 1.8, roughness: 0.1
      })
    );

    const gpsPinHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.85, 32),
      new THREE.MeshStandardMaterial({
        color: "#38bdf8", emissive: "#38bdf8", emissiveIntensity: 1.4, transparent: true, opacity: 0.7, side: THREE.DoubleSide
      })
    );
    gpsPinHalo.rotation.x = -Math.PI / 2;

    const gpsLabel = makeTextSprite("📍 Live Location", "#38bdf8");
    gpsLabel.position.y = 1.3;

    gpsUserGroup.add(gpsPinCore, gpsPinHalo, gpsLabel);
    gpsUserGroup.visible = false;

    // Orbit Camera State (Front Elevation View on targetBuilding)
    const initialZ = targetBuilding === "SJPB" ? -80 : (targetBuilding === "SPB" ? 0 : -40);
    const startRadiusVal = targetBuilding === "ALL" ? 80 : 44;
    const initialTheta = targetBuilding === "SJPB" ? Math.PI : 0;
    const initialPhi = Math.PI / 2.3; // Front elevation angle

    const target = new THREE.Vector3(0, FLOOR_BASE[1] + 1.2, initialZ);
    let radius = startRadiusVal, theta = initialTheta, phi = initialPhi;
    let dragging = false, lastX = 0, lastY = 0, autoRotate = true, idleTimer = null;
    let startX = 0, startY = 0;

    const activePointers = new Map();
    let initialPinchDist = 0, initialPinchRadius = 0;

    function updateCamera() {
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.lookAt(target);
    }
    updateCamera();

    function focusBuilding(bName) {
      if (bName === "SPB") {
        target.set(0, FLOOR_BASE[1] + 1.2, 0);
        radius = 44; theta = 0; phi = Math.PI / 2.3;
      } else if (bName === "SJPB") {
        target.set(0, FLOOR_BASE[1] + 1.2, -80);
        radius = 44; theta = Math.PI; phi = Math.PI / 2.3;
      } else {
        // ALL: Zoomed-out campus view showing BOTH buildings together
        target.set(0, FLOOR_BASE[1] + 1.2, -40);
        radius = 88; theta = Math.PI / 4; phi = Math.PI / 2.6;
      }
      updateCamera();
    }

    function setPreset(type) {
      if (type === "top") {
        radius = 85; theta = 0; phi = 0.05;
      } else if (type === "front") {
        radius = 78; theta = 0; phi = Math.PI / 2.3;
      } else {
        radius = targetBuilding === "ALL" ? 85 : 46; theta = Math.PI / 4; phi = Math.PI / 3.2;
      }
      updateCamera();
    }

    function onPointerDown(e) {
      activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      autoRotate = false;
      clearTimeout(idleTimer);

      if (activePointers.size === 1) {
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        startX = e.clientX; startY = e.clientY;
      } else if (activePointers.size === 2) {
        dragging = false;
        const pts = Array.from(activePointers.values());
        initialPinchDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        initialPinchRadius = radius;
      }
    }

    function onPointerMove(e) {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

      if (activePointers.size === 1 && dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        theta -= dx * 0.006;
        phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, phi - dy * 0.006));
        updateCamera();
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        if (initialPinchDist > 0 && dist > 0) {
          const factor = initialPinchDist / dist;
          radius = Math.max(8, Math.min(130, initialRadius * factor));
          updateCamera();
        }
      }
    }

    function onPointerUp(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) initialPinchDist = 0;

      if (activePointers.size === 0) {
        dragging = false;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { autoRotate = true; }, 4000);
      } else if (activePointers.size === 1) {
        const remaining = activePointers.values().next().value;
        lastX = remaining.clientX; lastY = remaining.clientY;
        dragging = true;
      }
    }

    function onWheel(e) {
      e.preventDefault();
      radius = Math.max(8, Math.min(130, radius + e.deltaY * 0.015));
      updateCamera();
    }

    function onClick(e) {
      const dragDist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dragDist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(roomMeshMap).map(v => v.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length) {
        const found = Object.entries(roomMeshMap).find(([id, v]) => v.mesh === hits[0].object);
        if (found) setSelected({ id: found[0], desc: found[1].desc, floor: found[1].floorKey });
      }
    }

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("click", onClick);

    let markerT = 0;
    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      if (autoRotate) { theta += 0.0015; updateCamera(); }
      if (waterSpray) {
        waterSpray.rotation.y += 0.025;
        waterSpray.scale.y = 1.0 + Math.sin(Date.now() * 0.006) * 0.15;
      }
      const vf = visibleFloorRef.current;
      FLOOR_DEFS.forEach(f => {
        if (vf === "all") {
          floorGroups[f.key].visible = true;
        } else if (Array.isArray(vf)) {
          floorGroups[f.key].visible = vf.includes(f.key);
        } else {
          floorGroups[f.key].visible = vf === f.key;
        }
      });
      if (threeRef.current.shellGroup) {
        threeRef.current.shellGroup.visible = (vf === "all") && threeRef.current.showShellState;
        if (threeRef.current.oppositeShellGroup) {
          threeRef.current.oppositeShellGroup.visible = (vf === "all") && threeRef.current.showShellState;
        }
      }
      if (threeRef.current.nodesGroup) {
        threeRef.current.nodesGroup.visible = threeRef.current.showNodesState;
      }
      if (threeRef.current.selectedRoomId && roomMeshMap[threeRef.current.selectedRoomId]) {
        const rPos = roomMeshMap[threeRef.current.selectedRoomId].mesh.position;
        beaconGroup.position.set(rPos.x, rPos.y + 0.5, rPos.z);
        beaconCylinder.visible = true;
        beaconRing.visible = true;
        beaconCylinder.rotation.y += 0.03;
        beaconRing.scale.setScalar(1.0 + Math.sin(Date.now() * 0.008) * 0.25);
      } else {
        beaconCylinder.visible = false;
        beaconRing.visible = false;
      }

      if (threeRef.current.pathCurve) {
        markerT = (markerT + 0.003) % 1;
        pathMarkerGroup.position.copy(threeRef.current.pathCurve.getPointAt(markerT));
        pathMarkerHalo.scale.setScalar(1.0 + Math.sin(Date.now() * 0.012) * 0.22);
        pathMarkerGroup.visible = true;
      } else {
        pathMarkerGroup.visible = false;
      }

      if (threeRef.current.userGpsPos) {
        const pos3d = convertGpsTo3DWorld(threeRef.current.userGpsPos);
        gpsUserGroup.position.set(pos3d.x, 0.25, pos3d.z);
        gpsUserGroup.visible = true;
        gpsPinHalo.scale.setScalar(1.0 + Math.sin(Date.now() * 0.008) * 0.3);
      } else {
        gpsUserGroup.visible = false;
      }
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    threeRef.current = {
      scene, shellGroup, oppositeShellGroup, roomMeshMap, entranceMeshMap, stairMeshMap, pathGroup, nodesGroup, showNodesState: showNodes, showShellState: showShell, pathCurve: null,
      resetView: () => { focusBuilding(targetBuilding); },
      focusBuilding,
      zoomIn: () => { radius = Math.max(15, radius - 10); updateCamera(); },
      zoomOut: () => { radius = Math.min(150, radius + 10); updateCamera(); },
      setPreset,
      toggleAutoRotate: () => { autoRotate = !autoRotate; },
      tubeColor,
    };

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("click", onClick);
      clearTimeout(idleTimer);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      });
      renderer.dispose();
      if (mount.contains(dom)) mount.removeChild(dom);
    };
  }, [themeMode]);

  useEffect(() => {
    if (threeRef.current) {
      threeRef.current.showNodesState = showNodes;
    }
  }, [showNodes]);

  useEffect(() => {
    if (threeRef.current) {
      threeRef.current.showShellState = showShell;
    }
  }, [showShell]);

  useEffect(() => {
    if (threeRef.current) {
      threeRef.current.selectedRoomId = selected ? selected.id : null;
    }
  }, [selected]);

  useEffect(() => {
    if (threeRef.current && threeRef.current.focusBuilding) {
      threeRef.current.focusBuilding(targetBuilding);
    }
  }, [targetBuilding]);

  function clearHighlights() {
    const { roomMeshMap, entranceMeshMap, stairMeshMap } = threeRef.current;
    if (!roomMeshMap) return;
    Object.values(roomMeshMap).forEach(v => {
      v.mesh.visible = true;
      if (v.line) v.line.visible = true;
      if (v.label) v.label.visible = true;
      v.mesh.material.emissive.set(0x000000);
      v.mesh.material.emissiveIntensity = 0;
    });
    if (entranceMeshMap) {
      Object.values(entranceMeshMap).forEach(v => {
        v.cone.visible = true;
        if (v.label) v.label.visible = true;
        v.cone.material.color.set(v.baseColor);
        if (v.cone.material.emissive) {
          v.cone.material.emissive.set(0x000000);
          v.cone.material.emissiveIntensity = 0;
        }
      });
    }
    if (stairMeshMap) {
      Object.values(stairMeshMap).forEach(v => {
        v.tower.visible = true;
        if (v.towerLine) v.towerLine.visible = true;
        if (v.label) v.label.visible = true;
        v.tower.material.opacity = 0.35;
      });
    }
  }

  function handleClearRoute() {
    const { pathGroup } = threeRef.current;
    if (pathGroup) {
      while (pathGroup.children.length) {
        const child = pathGroup.children.pop();
        child.geometry && child.geometry.dispose();
        child.material && child.material.dispose();
        pathGroup.remove(child);
      }
    }
    clearHighlights();
    threeRef.current.pathCurve = null;
    setSteps(null);
    setRouteStats(null);
    setVisibleFloor("all");
  }

  function handleFindRoute() {
    if (fromId === toId) { alert("Please choose two different locations."); return; }
    const res = dijkstra(fromId, toId);
    if (!res) { alert("No route could be found between these two points."); return; }
    const { path, distance } = res;

    // Isolate 3D floor block for the destination location
    const destNode = NODES[toId];
    if (destNode && destNode.floor) {
      setVisibleFloor(destNode.floor);
    }

    const { roomMeshMap, entranceMeshMap, stairMeshMap, pathGroup, tubeColor } = threeRef.current;

    while (pathGroup.children.length) {
      const child = pathGroup.children.pop();
      child.geometry && child.geometry.dispose();
      child.material && child.material.dispose();
      pathGroup.remove(child);
    }
    clearHighlights();

    const pathSet = new Set(path);
    const pathStairKeys = new Set();
    path.forEach(id => {
      const node = NODES[id];
      if (node && node.type === "stair") pathStairKeys.add(id.split("_")[0]);
    });

    Object.entries(roomMeshMap).forEach(([id, v]) => {
      const onPath = pathSet.has(id);
      v.mesh.visible = onPath;
      if (v.line) v.line.visible = onPath;
      if (v.label) v.label.visible = onPath;
    });

    if (entranceMeshMap) {
      Object.entries(entranceMeshMap).forEach(([id, v]) => {
        const onPath = pathSet.has(id);
        v.cone.visible = onPath;
        if (v.label) v.label.visible = onPath;
      });
    }

    if (stairMeshMap) {
      Object.entries(stairMeshMap).forEach(([key, v]) => {
        const onPath = pathStairKeys.has(key);
        v.tower.visible = onPath;
        if (v.towerLine) v.towerLine.visible = onPath;
        if (v.label) v.label.visible = onPath;
      });
    }

    const startId = path[0];
    const endId = path[path.length - 1];

    if (roomMeshMap[startId]) {
      roomMeshMap[startId].mesh.material.emissive.set("#10b981");
      roomMeshMap[startId].mesh.material.emissiveIntensity = 0.95;
    } else if (entranceMeshMap && entranceMeshMap[startId]) {
      entranceMeshMap[startId].cone.material.color.set("#10b981");
      entranceMeshMap[startId].cone.material.emissive.set("#10b981");
      entranceMeshMap[startId].cone.material.emissiveIntensity = 0.95;
    }

    if (roomMeshMap[endId]) {
      roomMeshMap[endId].mesh.material.emissive.set("#ef4444");
      roomMeshMap[endId].mesh.material.emissiveIntensity = 0.95;
    } else if (entranceMeshMap && entranceMeshMap[endId]) {
      entranceMeshMap[endId].cone.material.color.set("#ef4444");
      entranceMeshMap[endId].cone.material.emissive.set("#ef4444");
      entranceMeshMap[endId].cone.material.emissiveIntensity = 0.95;
    }

    path.forEach(id => {
      if (id !== startId && id !== endId) {
        const node = NODES[id];
        if (node.type === "stair") {
          const key = id.split("_")[0];
          stairMeshMap[key].tower.material.color.set(tubeColor || "#06b6d4");
          stairMeshMap[key].tower.material.opacity = 0.65;
        }
      }
    });

    const points = path.map(id => {
      const node = NODES[id];
      const fi = floorIndex(node.floor);
      const base = FLOOR_BASE[fi];
      return new THREE.Vector3(toWorldX(node.x), base + 0.22, toWorldZ(node.y));
    });

    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.05);
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(64, points.length * 20), 0.07, 10, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: tubeColor || "#06b6d4", emissive: tubeColor || "#06b6d4", emissiveIntensity: 1.3, roughness: 0.2 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    pathGroup.add(tube);

    const startSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshStandardMaterial({ color: "#10b981", emissive: "#10b981", emissiveIntensity: 1.2 }));
    startSphere.position.copy(points[0]);

    const endSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 1.2 }));
    endSphere.position.copy(points[points.length - 1]);

    pathGroup.add(startSphere, endSphere);

    // Keep only the start and end markers visible; hide intermediate door/waypoint markers.

    threeRef.current.pathCurve = curve;

    const { steps: buildStepList, stairFlightsCount } = buildSteps(path);
    setSteps(buildStepList);

    setRouteStats({ stairs: stairFlightsCount });

    const floorIndices = path.map(id => floorIndex(NODES[id].floor));
    const minIdx = Math.min(...floorIndices), maxIdx = Math.max(...floorIndices);
    const activeFloors = [];
    for (let i = minIdx; i <= maxIdx; i++) activeFloors.push(FLOOR_ORDER[i]);

    if (activeFloors.length === FLOOR_ORDER.length) setVisibleFloor("all");
    else if (activeFloors.length === 1) setVisibleFloor(activeFloors[0]);
    else setVisibleFloor(activeFloors);
  }

  function handleSwap() {
    setFromId(toId); setToId(fromId);
  }

  const floorTabs = [{ key: "all", label: "🏢 All Floors" }, ...FLOOR_DEFS.map(f => ({ key: f.key, label: f.label }))];

  const categoryChips = [
    { key: "all", label: "🌐 All Locations" },
    { key: "halls", label: "🏛️ Lecture Halls" },
    { key: "labs", label: "🧪 Labs & Research" },
    { key: "faculty", label: "👨‍🏫 Faculty & Staff" },
    { key: "toilets", label: "🚻 Restrooms & Waiting" },
  ];

  return (
    <div className={`main-container theme-${themeMode}`}>
      {/* HUD Top Header Bar */}
      <div className="header-bar">
        <div className="brand-section">
          {onGoHome && (
            <button
              className="hud-home-btn"
              onClick={onGoHome}
              title="Return to 2D Map Home"
            >
              <span className="home-icon">🏠</span>
              <span>Home</span>
            </button>
          )}
          <div className="brand-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <div className="brand-title">
              {targetBuilding === "ALL"
                ? "Campus 3D Model"
                : targetBuilding === "SJPB"
                ? "St John Paul Block"
                : "St Peter's Block"}
            </div>
            <div className="brand-subtitle">
              <span className="live-indicator-dot" />
              <span>
                {targetBuilding === "ALL"
                  ? "Full 3D Campus View (Both Buildings)"
                  : `3D Architectural View (${targetBuilding})`}
              </span>
            </div>
          </div>
        </div>

        <div className="header-controls">
          {/* Live GPS Tracking Toggle */}
          <button
            className={`hud-btn ${gpsFollow ? "active" : ""}`}
            onClick={() => setGpsFollow(!gpsFollow)}
            title="Live GPS Tracking & Auto Building Switch"
            style={{
              background: gpsFollow ? "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)" : "rgba(0,0,0,0.2)",
              color: "#ffffff",
              fontWeight: 700
            }}
          >
            📍 {gpsFollow ? (gpsBuildingDistance ? `GPS: Near ${gpsBuildingDistance.name}` : "GPS Live Track: ON") : "GPS Tracking: OFF"}
          </button>

          {/* Target Building Focus Selector */}
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.18)", padding: 4, borderRadius: 14 }}>
            <button
              className={`hud-btn ${targetBuilding === "ALL" ? "active" : ""}`}
              onClick={() => onSwitchBuilding?.("ALL")}
              title="Full 3D Campus (Both Buildings)"
            >
              🌐 Both Buildings
            </button>
            <button
              className={`hud-btn ${targetBuilding === "SPB" ? "active" : ""}`}
              onClick={() => onSwitchBuilding?.("SPB")}
              title="Focus St. Peter's Block"
            >
              🏢 SPB Focus
            </button>
            <button
              className={`hud-btn ${targetBuilding === "SJPB" ? "active" : ""}`}
              onClick={() => onSwitchBuilding?.("SJPB")}
              title="Focus St. John Paul Block"
            >
              🏢 SJPB Focus
            </button>
          </div>
          {/* Exterior Facade Building Shell Toggle */}
          <button
            className={`hud-btn ${showShell ? "active" : ""}`}
            onClick={() => setShowShell(!showShell)}
            title="Toggle Building Facade Shell"
            aria-label="Toggle Building Facade Shell"
          >
            🏛️ {showShell ? "Building Facade: ON" : "Building Facade: OFF"}
          </button>

          {/* Theme Selector Pill Group */}
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.18)", padding: 4, borderRadius: 14 }}>
            <button
              className={`hud-btn ${themeMode === "warm" ? "active" : ""}`}
              onClick={() => setThemeMode("warm")}
              title="Terracotta Campus Theme"
              aria-label="Terracotta Campus Theme"
            >
              🏛️ Terracotta Campus
            </button>
            <button
              className={`hud-btn ${themeMode === "dark" ? "active" : ""}`}
              onClick={() => setThemeMode("dark")}
              title="Obsidian Midnight Theme"
              aria-label="Obsidian Midnight Theme"
            >
              🌌 Obsidian Midnight
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toggle Drawer Button when Drawer is Collapsed (Only for SPB indoor graph) */}
      {targetBuilding === "SPB" && !drawerOpen && (
        <button className="toggle-drawer-btn" onClick={() => setDrawerOpen(true)} title="Open Navigation Panel" aria-label="Open Navigation Panel">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Floating Floor Selector Bar (Center Top) */}
      <div className="floor-selector-bar" role="navigation" aria-label="Floor Selection">
        {floorTabs.map(t => {
          const isTabActive = visibleFloor === t.key || (Array.isArray(visibleFloor) && visibleFloor.includes(t.key));
          return (
            <button
              key={t.key}
              onClick={() => setVisibleFloor(t.key)}
              className={`floor-pill-btn ${isTabActive ? "active" : ""}`}
              aria-label={t.label}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Camera View Toolbar (Right Side) */}
      <div className="camera-toolbar" role="toolbar" aria-label="3D View Controls">
        <button
          className={`camera-btn ${cameraPreset === "iso" ? "active" : ""}`}
          onClick={() => { setCameraPreset("iso"); threeRef.current.setPreset && threeRef.current.setPreset("iso"); }}
          title="3D Isometric Perspective"
          aria-label="3D Isometric Perspective"
        >
          📐
        </button>
        <button
          className={`camera-btn ${cameraPreset === "top" ? "active" : ""}`}
          onClick={() => { setCameraPreset("top"); threeRef.current.setPreset && threeRef.current.setPreset("top"); }}
          title="2D Top-Down Floorplan"
          aria-label="2D Top-Down Floorplan"
        >
          🔝
        </button>
        <button
          className={`camera-btn ${cameraPreset === "front" ? "active" : ""}`}
          onClick={() => { setCameraPreset("front"); threeRef.current.setPreset && threeRef.current.setPreset("front"); }}
          title="Front Building Elevation"
          aria-label="Front Building Elevation"
        >
          🏢
        </button>
        <div style={{ height: 1, background: "var(--btn-border)", margin: "2px 0" }} />
        <button className="camera-btn" onClick={() => threeRef.current.zoomIn && threeRef.current.zoomIn()} title="Zoom In" aria-label="Zoom In">
          ➕
        </button>
        <button className="camera-btn" onClick={() => threeRef.current.zoomOut && threeRef.current.zoomOut()} title="Zoom Out" aria-label="Zoom Out">
          ➖
        </button>
        <button className="camera-btn" onClick={() => threeRef.current.resetView && threeRef.current.resetView()} title="Reset Camera View" aria-label="Reset Camera View">
          🔄
        </button>
      </div>

      <div className="content-row">
        {/* Sidebar Panel Drawer (Only for SPB indoor graph) */}
        {targetBuilding === "SPB" && (
          <div className={`sidebar-panel ${!drawerOpen ? "collapsed" : ""}`}>
          <div className="drawer-header">
            <div className="mobile-pull-handle" onClick={() => setDrawerOpen(false)} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div className="drawer-nav-tabs" role="tablist">
                <button className={`drawer-tab-btn ${activeTab === "route" ? "active" : ""}`} onClick={() => setActiveTab("route")} role="tab" aria-selected={activeTab === "route"}>
                  🗺️ Route Planner
                </button>
                <button className={`drawer-tab-btn ${activeTab === "search" ? "active" : ""}`} onClick={() => setActiveTab("search")} role="tab" aria-selected={activeTab === "search"}>
                  🔍 Room Directory
                </button>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem", padding: "4px 8px" }}
                title="Close Navigation Drawer"
                aria-label="Close Navigation Drawer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="drawer-body">
            {activeTab === "route" && (
              <>
                {/* Category Quick Filter */}
                <div>
                  <div className="input-label">Filter Category</div>
                  <div className="chips-container">
                    {categoryChips.map(c => (
                      <button
                        key={c.key}
                        onClick={() => setSearchCategory(c.key)}
                        className={`chip-btn ${searchCategory === c.key ? "active" : ""}`}
                        aria-label={c.label}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* From Location Search & Selection */}
                <div>
                  <div className="input-label">
                    <span>From (Start Point)</span>
                    <span style={{ color: "var(--badge-start)", fontWeight: 900 }}>📍 Start Point</span>
                  </div>
                  <SearchableSelect
                    value={fromId}
                    onChange={setFromId}
                    searchCategory={searchCategory}
                    placeholder="Type or select start room..."
                  />
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 6 }}>
                    Nearest Staircase: <strong>{getNearestStairKey(fromId) === "A" ? "Staircase 1" : "Staircase 2"}</strong> ({getStairDirection(fromId, getNearestStairKey(fromId))})
                  </div>
                </div>

                {/* Swap Button */}
                <div className="swap-btn-wrapper">
                  <button className="swap-circle-btn" onClick={handleSwap} title="Swap Start & Destination" aria-label="Swap Start and Destination">
                    ⇅
                  </button>
                </div>

                {/* To Location Search & Selection */}
                <div>
                  <div className="input-label">
                    <span>To (Destination)</span>
                    <span style={{ color: "var(--badge-end)", fontWeight: 900 }}>🏁 Destination</span>
                  </div>
                  <SearchableSelect
                    value={toId}
                    onChange={setToId}
                    searchCategory={searchCategory}
                    placeholder="Type or select destination room..."
                  />
                </div>

                <button className="action-btn-primary" onClick={handleFindRoute} aria-label="Find Shortest Route">
                  <span>🚀</span> Find Shortest Route
                </button>

                {steps && (
                  <button className="action-btn-secondary" onClick={handleClearRoute} aria-label="Clear Route">
                    Clear Route
                  </button>
                )}

                {/* Route Summary Stats */}
                {routeStats && routeStats.stairs > 0 && (
                  <div className="route-summary-card">
                    <div className="stat-box" style={{ width: "100%" }}>
                      <div className="stat-val">🪜 {routeStats.stairs}</div>
                      <div className="stat-lbl">Stair Flights</div>
                    </div>
                  </div>
                )}

                {/* Step-by-Step Directions */}
                {steps && (
                  <div>
                    <div className="input-label" style={{ marginBottom: 10 }}>Step-by-Step Directions</div>
                    <div className="directions-list">
                      {steps.map((st, i) => (
                        <div key={i} className="direction-step">
                          <div className="step-num">{i + 1}</div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{st.title}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{st.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}

            {activeTab === "search" && (
              <>
                <div className="input-label">Building Directory</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {FLOOR_DEFS.map(floor => (
                    <div key={floor.key} style={{ background: "rgba(0,0,0,0.14)", borderRadius: 16, padding: 14 }}>
                      <div style={{ fontWeight: 900, fontSize: "0.88rem", fontFamily: "var(--font-heading)", color: "var(--accent-glow)", marginBottom: 10 }}>
                        {floor.label}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {floor.rooms.map(r => (
                          <div
                            key={r.id}
                            onClick={() => setSelected({ id: r.id, desc: r.desc, floor: floor.key })}
                            style={{
                              padding: "9px 12px",
                              borderRadius: 10,
                              background: "var(--chip-bg)",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.84rem",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>Room {r.id}</span>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{r.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* 3D Canvas Mount */}
        <div className="canvas-wrapper">
          <div ref={mountRef} className="canvas-element" />

          {/* Selected Room Detail Drawer Pop-up Card */}
          {selected && (
            <div className="room-card-popup">
              <div className="card-close-btn" onClick={() => setSelected(null)}>✕</div>
              <div className="room-card-badge">{floorLabel(selected.floor)}</div>
              <div className="room-card-title">Room {selected.id}</div>
              <div className="room-card-subtitle">{selected.desc}</div>

              <div className="room-card-actions">
                <button
                  className="card-act-btn start"
                  onClick={() => { setFromId(selected.id); setSelected(null); setDrawerOpen(true); }}
                >
                  📍 Set as Start
                </button>
                <button
                  className="card-act-btn end"
                  onClick={() => { setToId(selected.id); setSelected(null); setDrawerOpen(true); }}
                >
                  🏁 Set as End
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
