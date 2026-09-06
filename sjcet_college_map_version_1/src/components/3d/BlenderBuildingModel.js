import * as THREE from "three";

/* ==========================================================================
   ST PETER'S BLOCK — 3D BLENDER ARCHITECTURAL BUILDING MODEL
   --------------------------------------------------------------------------
   This file contains the full 3D building shell construction logic:
   - W = 40, DEPTH = 8, HEIGHT = 12 (Blender Units converted to Three.js)
   - Materials & colors: Terracotta panels, Cream columns, Roof tiles, Windows, etc.
   - Front and back identical facades & entrances
   - Central tower & pitched triangular gable roof
   - Full side walls with 3 tiers of window frames
   
   To edit building colors or materials:
   - Edit the material definitions below (WALL, CREAM, TERRA, GLASS, ROOF, etc.).
   
   To edit building dimensions or structure:
   - Edit the cube(), cylinder(), gable(), or windowObj() calls in this file.
   ========================================================================== */

export function buildBlenderBuildingShell(buildingName = "ST. PETER'S BLOCK") {
  const shellGroup = new THREE.Group();

  // Materials directly matching Blender script diffuse_color & roughness
  const WALL = new THREE.MeshStandardMaterial({ color: "#e0c7a8", roughness: 0.55, metalness: 0.05 });
  const CREAM = new THREE.MeshStandardMaterial({ color: "#eddcc6", roughness: 0.45, metalness: 0.1 });
  const TERRA = new THREE.MeshStandardMaterial({ color: "#ad381a", roughness: 0.50, metalness: 0.05 });
  const GLASS = new THREE.MeshStandardMaterial({ color: "#0f1f26", roughness: 0.20, metalness: 0.85, transparent: true, opacity: 0.65 });
  const WOOD = new THREE.MeshStandardMaterial({ color: "#331206", roughness: 0.60, metalness: 0.1 });
  const ROOF = new THREE.MeshStandardMaterial({ color: "#61210e", roughness: 0.50, metalness: 0.1, side: THREE.DoubleSide });
  const CANOPY = new THREE.MeshStandardMaterial({ color: "#85260f", roughness: 0.40, metalness: 0.1 });
  const SIGN = new THREE.MeshStandardMaterial({ color: "#05298c", roughness: 0.30, metalness: 0.3 });
  const DARK = new THREE.MeshStandardMaterial({ color: "#040505", roughness: 0.90 });
  const STEP = new THREE.MeshStandardMaterial({ color: "#141417", roughness: 0.80 });
  const GROUND = new THREE.MeshStandardMaterial({ color: "#335724", roughness: 0.95 });
  const PAVING = new THREE.MeshStandardMaterial({ color: "#857359", roughness: 0.60 });

  // 1:1 Mapping constants between Blender space (W=40, DEPTH=8, HEIGHT=12) and Three.js World
  const SX = 12.4 / 20.0;
  const SZ = 17.0 / 4.0;
  const SY = 8.4 / 12.0;

  const mX = (x) => x * SX;
  const mZ = (y) => y * SZ; // Blender Y is Three.js Z (depth)
  const mY = (z) => z * SY; // Blender Z is Three.js Y (height)

  const cube = (name, loc, size, material) => {
    // Blender size (dx, dy, dz) -> Three size (dx*SX, dz*SY, dy*SZ)
    const wX = Math.abs(size[0] * SX);
    const wY = Math.abs(size[2] * SY);
    const wZ = Math.abs(size[1] * SZ);

    const geo = new THREE.BoxGeometry(wX, wY, wZ);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(mX(loc[0]), mY(loc[2]), mZ(loc[1]));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    shellGroup.add(mesh);
    return mesh;
  };

  const cylinder = (name, loc, radius, depth, material) => {
    const wRadius = radius * ((SX + SZ) / 2);
    const wHeight = depth * SY;
    const geo = new THREE.CylinderGeometry(wRadius, wRadius, wHeight, 32);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(mX(loc[0]), mY(loc[2]), mZ(loc[1]));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    shellGroup.add(mesh);
    return mesh;
  };

  const gable = (name, x1, x2, y1, y2, zbase, ztop, material) => {
    const cx = (x1 + x2) / 2;
    const vertices = new Float32Array([
      mX(x1), mY(zbase), mZ(y1),
      mX(x2), mY(zbase), mZ(y1),
      mX(cx), mY(ztop), mZ(y1),

      mX(x1), mY(zbase), mZ(y2),
      mX(x2), mY(zbase), mZ(y2),
      mX(cx), mY(ztop), mZ(y2),
    ]);

    const indices = [
      0, 2, 1,
      3, 4, 5,
      0, 1, 4, 0, 4, 3,
      1, 4, 5, 1, 5, 2,
      0, 3, 5, 0, 5, 2
    ];

    let geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo = geo.toNonIndexed();
    geo.computeVertexNormals();

    const mat = material.clone();
    mat.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    shellGroup.add(mesh);
    return mesh;
  };

  const windowObj = (cx, cy, cz, width = 1.45, height = 1.55, rotY = 0) => {
    const winGroup = new THREE.Group();

    // Glass pane facing local -Z
    const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(width * SX, height * SY, 0.12 * SZ), GLASS);
    glassMesh.castShadow = true;
    winGroup.add(glassMesh);

    const t = 0.10;
    // Wood Outer Frames
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(t * SX, height * SY, 0.18 * SZ), WOOD);
    leftF.position.set((-width / 2 + t / 2) * SX, 0, -0.04 * SZ);
    winGroup.add(leftF);

    const rightF = new THREE.Mesh(new THREE.BoxGeometry(t * SX, height * SY, 0.18 * SZ), WOOD);
    rightF.position.set((width / 2 - t / 2) * SX, 0, -0.04 * SZ);
    winGroup.add(rightF);

    const topF = new THREE.Mesh(new THREE.BoxGeometry(width * SX, t * SY, 0.18 * SZ), WOOD);
    topF.position.set(0, (height / 2 - t / 2) * SY, -0.04 * SZ);
    winGroup.add(topF);

    const botF = new THREE.Mesh(new THREE.BoxGeometry(width * SX, t * SY, 0.18 * SZ), WOOD);
    botF.position.set(0, (-height / 2 + t / 2) * SY, -0.04 * SZ);
    winGroup.add(botF);

    // Center Vertical Mullion
    const midF = new THREE.Mesh(new THREE.BoxGeometry(0.08 * SX, height * SY, 0.20 * SZ), WOOD);
    midF.position.set(0, 0, -0.05 * SZ);
    winGroup.add(midF);

    // Protruding Cream Sill
    const sillMesh = new THREE.Mesh(new THREE.BoxGeometry((width + 0.20) * SX, 0.12 * SY, 0.30 * SZ), CREAM);
    sillMesh.position.set(0, (-height / 2 - 0.08) * SY, -0.08 * SZ);
    winGroup.add(sillMesh);

    winGroup.position.set(mX(cx), mY(cz), mZ(cy));
    winGroup.rotation.y = rotY;
    shellGroup.add(winGroup);
  };

  // 1. MAIN BUILDING BODY
  cube("Main Building", [0, 0, 6.0], [40, 8, 12.0], WALL);

  // TOP PARAPET ROOF CORNICE MOLDING (Main Building Top Roof Cap)
  cube("Top Parapet Trim Front", [0, -4.05, 12.1], [40.8, 0.40, 0.30], CREAM);
  cube("Top Parapet Trim Back", [0, 4.05, 12.1], [40.8, 0.40, 0.30], CREAM);
  cube("Top Parapet Trim Left", [-20.15, 0, 12.1], [0.30, 8.4, 0.30], CREAM);
  cube("Top Parapet Trim Right", [20.15, 0, 12.1], [0.30, 8.4, 0.30], CREAM);

  // 2. TERRACOTTA FRONT & BACK FACADE PANELS
  const facade_panels = (y, front = true) => {
    for (const [x1, x2] of [
      [-19.4, -16.5], [-16.0, -12.7], [-12.2, -8.8],
      [8.8, 12.2], [12.7, 16.0], [16.5, 19.4]
    ]) {
      for (const [z1, z2] of [
        [0.4, 3.9], [4.15, 7.55], [7.85, 11.15]
      ]) {
        cube("Terracotta Panel", [(x1 + x2) / 2, y, (z1 + z2) / 2], [x2 - x1, 0.12, z2 - z1], TERRA);
      }
    }

    for (const z of [3.85, 7.55, 11.15]) {
      cube("Horizontal Band", [0, y, z + 0.19], [40.6, 0.35, 0.38], CREAM);
    }

    for (const x of [-20, -16.5, -12.5, -8.0, -4, 4, 8.0, 12.5, 16.5, 20]) {
      cube("Vertical Column", [x, y, 5.9], [0.36, 0.45, 11.3], CREAM);
    }
  };

  facade_panels(-4.05, true);
  facade_panels(4.05, false);

  // 3. CENTRAL TOWER & SINGLE CENTRAL ROOF PEAK (Front and Back)
  for (const y of [-4.25, 4.25]) {
    // Central Main Spire Tower (Reduced height block above building)
    cube("Central Tower", [0, y, 6.6], [6.4, 0.55, 13.2], CREAM);
    for (const x of [-3.0, 3.0]) {
      cube("Tower Frame", [0, y, 6.6], [0.35, 0.65, 13.2], CREAM);
    }

    // High Arched Glass Window on Top Floor of Central Tower
    const archY = y < 0 ? y - 0.32 : y + 0.32;
    cube("Central Arch Window Base", [0, archY, 11.2], [2.4, 0.12, 1.4], GLASS);
    gable("Central Arch Window Top Gable", -1.2, 1.2, archY - 0.06, archY + 0.06, 11.9, 12.6, GLASS);
  }

  // 4. WINDOWS (Front and Back Facades with additional Window columns)
  for (const y of [-4.30, 4.30]) {
    const rotY = y < 0 ? 0 : Math.PI;
    for (const z of [2.1, 5.55, 8.9]) {
      for (const x of [-17.8, -14.2, -11.2, -8.0, -5.2, 5.2, 8.0, 11.2, 14.2, 17.8]) {
        windowObj(x, y, z, 1.45, 1.55, rotY);
      }
    }
    for (const [z, w] of [
      [2.1, 1.6], [5.5, 1.6], [8.9, 1.6], [10.8, 1.35], [11.8, 1.15]
    ]) {
      windowObj(0, y, z, w, 1.35, rotY);
    }
  }

  // 5. CENTRAL ARCH & ENTRANCE TOWER
  for (const y of [-4.45, 4.45]) {
    cube("Central Entrance Tower", [0, y, 6.4], [4.8, 0.55, 12.8], CREAM);
    cube("Central Arch Glass", [0, y < 0 ? y - 0.32 : y + 0.32, 10.2], [2.0, 0.12, 2.2], GLASS);
  }

  function createSignTexture(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0c2340";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.font = "bold 42px 'Outfit', sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  const signTex = createSignTexture(buildingName);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3, metalness: 0.2 });

  // ENTRANCE BUILDER (Clean Facade Entrance)
  const buildEntrance = (front = true) => {
    const ySign = front ? -1 : 1;
    const prefix = front ? "Front" : "Back";

    // Dark Recessed Entryway Portal
    cube(prefix + " Entrance Recess", [0, ySign * 4.42, 2.0], [5.8, 0.30, 3.6], DARK);

    // 3-Tier Stepped Stairs
    const stepsDef = [
      [0.25, 0.55, 4.8],
      [0.48, 0.45, 4.3],
      [0.71, 0.35, 3.8]
    ];
    stepsDef.forEach(([z, depth, width], i) => {
      cube(prefix + " Entrance Step", [0, ySign * (4.85 + depth * i / 3), z + 0.1], [width, depth, 0.20], STEP);
    });

    // Main Entrance Header Fascia Beam right above entrance columns
    cube(prefix + " Entrance Header Fascia", [0, ySign * 4.68, 4.18], [9.8, 0.30, 0.40], CREAM);
    
    // Entrance Name Plaque Sign
    cube(prefix + " Entrance Name Plaque", [0, ySign * 4.84, 4.18], [4.6, 0.08, 0.65], signMat);
  };

  buildEntrance(true);  // Front Entrance
  buildEntrance(false); // Back Entrance

  // ROOFS (Proportionate Roof Peak over Center Entrance Tower)
  gable("Front Central Roof Peak", -3.45, 3.45, -4.50, -3.80, 13.2, 14.5, ROOF);
  gable("Back Central Roof Peak", -3.45, 3.45, 3.80, 4.50, 13.2, 14.5, ROOF);

  // Ground Stepped Base Platform
  cube("Building Ground Base Platform", [0, 0, -0.25], [44.0, 8.8, 0.30], CREAM);

  // FULL SIDE FACADES (Left & Right Side Walls)
  for (const x of [-20.15, 20.15]) {
    const isLeft = x < 0;
    const dir = isLeft ? -1 : 1;
    const rotY = isLeft ? -Math.PI / 2 : Math.PI / 2;
    const offPanel = dir * 0.08;
    const offCol = dir * 0.12;
    const offBand = dir * 0.10;

    cube("Side Main Wall", [x, 0, 6.0], [0.30, 8.2, 12.0], WALL);

    for (const [y1, y2] of [
      [-3.6, -1.9], [-1.7, 0.0], [0.2, 1.9], [2.1, 3.8]
    ]) {
      for (const [z1, z2] of [
        [0.4, 3.9], [4.15, 7.55], [7.85, 11.15]
      ]) {
        cube("Side Terracotta Panel", [x + offPanel, (y1 + y2) / 2, (z1 + z2) / 2], [0.12, y2 - y1, z2 - z1], TERRA);
      }
    }

    for (const z of [3.85, 7.55, 11.15]) {
      cube("Side Horizontal Band", [x + offBand, 0, z + 0.19], [0.35, 8.2, 0.38], CREAM);
    }

    for (const y of [-3.85, -1.8, 0.1, 2.0, 3.85]) {
      cube("Side Vertical Column", [x + offCol, y, 5.9], [0.45, 0.36, 11.3], CREAM);
    }

    // Side facade windows
    for (const z of [2.1, 5.55, 8.9]) {
      for (const y of [-2.75, -0.85, 1.05, 2.95]) {
        windowObj(x, y, z, 1.45, 1.55, rotY);
      }
    }
  }

  // GROUND & PAVING
  cube("Ground Lawn", [0, 0, -0.40], [46, 16, 0.30], GROUND);
  cube("Front Paving", [0, -6.0, -0.15], [43, 3.0, 0.10], PAVING);

  return shellGroup;
}
