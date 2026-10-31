import * as THREE from "three";

// Deterministic, original botanical geometry. All repeated parts are merged by
// material, so one plant is only five draw calls, not hundreds of tiny meshes.
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function merge(parts) {
  const positions = [],
    normals = [],
    colors = [],
    uvs = [];
  parts.forEach(({ geometry, matrix, color }) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.applyMatrix4(matrix);
    const uv = g.getAttribute("uv");
    const p = g.getAttribute("position"),
      n = g.getAttribute("normal"),
      c = g.getAttribute("color");
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
      normals.push(n.getX(i), n.getY(i), n.getZ(i));
      const k = c
        ? [c.getX(i), c.getY(i), c.getZ(i)]
        : [color.r, color.g, color.b];
      colors.push(...k);
    }
    g.dispose();
    geometry.dispose();
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.computeBoundingSphere();
  return g;
}
function leafGeometry(length, width, bend, tint, serrated = false) {
  const positions = [],
    colors = [],
    indices = [],
    c = new THREE.Color(tint);
  const rows = 12,
    cols = 6;
  for (let i = 0; i <= rows; i++)
    for (let j = 0; j <= cols; j++) {
      const t = i / rows,
        s = (j / cols) * 2 - 1;
      const shape =
        Math.pow(Math.sin(Math.PI * t), 0.8) *
        (serrated ? 1 + 0.06 * Math.sin(t * Math.PI * 18) : 1);
      positions.push(
        s * width * shape,
        t * length,
        bend * t * t +
          0.12 * length * Math.sin(t * Math.PI) +
          Math.pow(Math.abs(s), 1.5) * length * 0.08,
      );
      const shade =
        0.65 + 0.28 * Math.sin(t * Math.PI) + 0.12 * (1 - Math.abs(s));
      colors.push(c.r * shade, c.g * shade, c.b * shade);
      if (i < rows && j < cols) {
        const a = i * (cols + 1) + j,
          b = a + cols + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      Array.from({ length: (rows + 1) * (cols + 1) }, (_, i) => [
        (i % (cols + 1)) / cols,
        Math.floor(i / (cols + 1)) / rows,
      ]).flat(),
      2,
    ),
  );
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function createHerbModel(kind) {
  const buckets = { stem: [], leaf: [], crown: [], vein: [], dew: [] };
  const palettes = {
    red: ["#3a5841", "#354c37", "#9b2942"],
    yellow: ["#506039", "#536a36", "#dfa83d"],
    green: ["#395b32", "#5b884c", "#94aa60"],
    blue: ["#385e51", "#315e56", "#566aab"],
  };
  const [stemColor, leafColor, crownColor] = palettes[kind] || palettes.green;
  const add = (
    geometry,
    bucket,
    color,
    position = V(0, 0, 0),
    quaternion = new THREE.Quaternion(),
    scale = V(1, 1, 1),
  ) => {
    buckets[bucket].push({
      geometry,
      color: new THREE.Color(color),
      matrix: new THREE.Matrix4().compose(position, quaternion, scale),
    });
  };
  const tube = (pts, r, bucket = "stem", color = stemColor) =>
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        Math.max(8, pts.length * 3),
        r,
        5,
        false,
      ),
      bucket,
      color,
    );
  const leaf = (
    at,
    dir,
    len,
    width,
    tint = leafColor,
    bend = 0.12,
    serrated = false,
  ) => {
    const q = new THREE.Quaternion().setFromUnitVectors(
      V(0, 1, 0),
      dir.clone().normalize(),
    );
    add(leafGeometry(len, width, bend, tint, serrated), "leaf", tint, at, q);
    const point = (t, s = 0) =>
      V(
        s * width * Math.pow(Math.sin(Math.PI * t), 0.8),
        t * len,
        bend * t * t + 0.12 * len * Math.sin(t * Math.PI) + 0.005,
      )
        .applyQuaternion(q)
        .add(at);
    tube(
      [point(0), point(0.33), point(0.66), point(0.95)],
      0.006,
      "vein",
      kind === "red" ? "#ba7a6a" : "#9bac6c",
    );
    if (len > 0.5)
      [0.3, 0.55, 0.75].forEach((t) =>
        [-1, 1].forEach((side) =>
          tube(
            [point(t), point(t + 0.12, side * 0.7)],
            0.0025,
            "vein",
            "#87996a",
          ),
        ),
      );
  };
  const stem = [
    V(0, 0, 0),
    V(-0.06, 0.65, 0.03),
    V(0.08, 1.45, -0.06),
    V(0, 2.2, 0),
  ];
  if (kind !== "green") tube(stem, 0.028);
  // A small natural root crown and branching taper, rather than a flower pot.
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399;
    tube(
      [
        V(0, 0.12, 0),
        V(Math.cos(a) * 0.13, 0.03, Math.sin(a) * 0.13),
        V(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26),
      ],
      0.016,
      "stem",
      "#70543b",
    );
  }
  if (kind === "red") {
    for (let b = 0; b < 3; b++) {
      const a = b * 2.4,
        base = V(Math.cos(a) * 0.16, 0.8 + b * 0.25, Math.sin(a) * 0.13),
        top = base
          .clone()
          .add(V(Math.cos(a) * 0.3, 1.45 - b * 0.12, Math.sin(a) * 0.24));
      tube(
        [
          base,
          base
            .clone()
            .lerp(top, 0.5)
            .add(V(0.05, 0, 0.04)),
          top,
        ],
        0.017,
      );
      for (let k = 0; k < 44; k++) {
        const t = k / 44,
          at = base.clone().lerp(top, t),
          a2 = k * 2.399;
        const len = 0.25 * Math.sin(t * Math.PI * 0.8) + 0.1;
        const q = new THREE.Quaternion().setFromUnitVectors(
          V(0, 1, 0),
          V(Math.cos(a2) * 0.8, 0.6, Math.sin(a2) * 0.8).normalize(),
        );
        add(
          leafGeometry(
            len,
            len * 0.075,
            0.09,
            k % 3 ? "#95233e" : "#ba4654",
            true,
          ),
          "crown",
          crownColor,
          at,
          q,
        );
      }
    }
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      leaf(
        V(0, 0.4 + i * 0.16, 0),
        V(Math.cos(a), 0.3, Math.sin(a)),
        0.58,
        0.18,
        leafColor,
        0.18,
        true,
      );
    }
  } else if (kind === "yellow") {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399,
        at = V(0.03, 1 + i * 0.18, 0),
        end = V(
          Math.cos(a) * (0.4 + (i % 2) * 0.15),
          1.05 + i * 0.18,
          Math.sin(a) * 0.43,
        );
      tube(
        [
          at,
          at
            .clone()
            .lerp(end, 0.5)
            .add(V(0, 0.2, 0)),
          end,
        ],
        0.013,
      );
      const pts = [];
      for (let j = 0; j <= 18; j++) {
        const t = j / 18;
        pts.push(
          new THREE.Vector2(
            Math.sin(Math.PI * t) * (0.16 + 0.03 * Math.sin(t * 8)),
            t * 0.43,
          ),
        );
      }
      const g = new THREE.LatheGeometry(pts, 28);
      const pos = g.getAttribute("position");
      for (let j = 0; j < pos.count; j++) {
        const x = pos.getX(j),
          z = pos.getZ(j),
          a2 = Math.atan2(z, x),
          r = 1 + 0.085 * Math.cos(a2 * 5);
        pos.setXYZ(j, x * r, pos.getY(j), z * r);
      }
      g.computeVertexNormals();
      const base = end.clone().add(V(0, -0.43, 0));
      add(g, "crown", i % 2 ? "#c38e2b" : "#e6b345", base);
      for (let rib = 0; rib < 5; rib++) {
        const a2 = (rib * Math.PI * 2) / 5;
        const path = [];
        for (let j = 0; j <= 10; j++) {
          const t = j / 10,
            r = Math.sin(Math.PI * t) * (0.16 + 0.03 * Math.sin(t * 8)) * 1.09;
          path.push(
            base.clone().add(V(Math.cos(a2) * r, t * 0.43, Math.sin(a2) * r)),
          );
        }
        tube(path, 0.0035, "vein", "#f4d68a");
      }
      for (let j = 0; j < 3; j++) {
        const a2 = a + j * 2.094;
        leaf(
          end,
          V(Math.cos(a2), -0.3, Math.sin(a2)),
          0.14,
          0.045,
          "#9c7c38",
          0.03,
        );
      }
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4;
      leaf(
        V(0, 0.35 + i * 0.2, 0),
        V(Math.cos(a), 0.2, Math.sin(a)),
        0.65,
        0.1,
        leafColor,
        0.22,
      );
    }
  } else if (kind === "green") {
    for (let f = 0; f < 6; f++) {
      const a = f * 2.399,
        length = 1.4 + (f % 3) * 0.33;
      const path = [];
      for (let j = 0; j <= 18; j++) {
        const t = j / 18;
        path.push(V(Math.cos(a) * t * 0.55, length * t, Math.sin(a) * t * 0.5));
      }
      tube(path, 0.018);
      for (let j = 2; j < 12; j++) {
        const t = j / 13,
          at = V(Math.cos(a) * t * 0.55, length * t, Math.sin(a) * t * 0.5),
          len = 0.38 * Math.sin(t * Math.PI) + 0.08;
        [-1, 1].forEach((side) =>
          leaf(
            at,
            V(Math.cos(a + side * 1.2), 0.22, Math.sin(a + side * 1.2)),
            len,
            0.075,
            j % 2 ? leafColor : "#78944f",
            0.11,
            true,
          ),
        );
      }
      const tip = path[path.length - 1],
        spiral = [];
      for (let j = 0; j <= 30; j++) {
        const t = j / 30,
          theta = t * Math.PI * 3.2,
          r = 0.14 * (1 - t) + 0.008;
        spiral.push(
          tip
            .clone()
            .add(
              V(
                Math.cos(a) * r * Math.sin(theta),
                r * Math.cos(theta) - 0.148,
                Math.sin(a) * r * Math.sin(theta),
              ),
            ),
        );
      }
      tube(spiral, 0.022, "crown", crownColor);
    }
  } else {
    for (let b = 0; b < 4; b++) {
      const a = b * 2.399,
        base = V(0, 0.75 + b * 0.24, 0),
        center = V(Math.cos(a) * 0.48, 1.5 + b * 0.26, Math.sin(a) * 0.43);
      tube(
        [
          base,
          base
            .clone()
            .lerp(center, 0.6)
            .add(V(0, 0.1, 0)),
          center,
        ],
        0.014,
      );
      // Six folded pointed petals, each curved in 3D around its own radial axis.
      for (let petal = 0; petal < 6; petal++) {
        const a2 = (petal * Math.PI) / 3;
        const q = new THREE.Quaternion().setFromUnitVectors(
          V(0, 1, 0),
          V(Math.cos(a2), Math.sin(a2), 0.18).normalize(),
        );
        add(
          leafGeometry(0.4, 0.085, 0.035, petal % 2 ? "#839acb" : "#516fba"),
          "crown",
          crownColor,
          center,
          q,
        );
      }
      add(
        new THREE.SphereGeometry(0.065, 12, 8),
        "dew",
        "#a8d8eb",
        center.clone().add(V(0, 0, 0.045)),
        new THREE.Quaternion(),
        V(1, 0.6, 1),
      );
      for (let st = 0; st < 7; st++) {
        const a2 = st * 2.399,
          top = center
            .clone()
            .add(V(Math.cos(a2) * 0.075, Math.sin(a2) * 0.075, 0.12));
        tube([center, top], 0.004, "vein", "#dbbb72");
        add(new THREE.SphereGeometry(0.018, 6, 4), "vein", "#e0be66", top);
      }
    }
    // Smaller unopened buds break up the silhouette and connect the flowers
    // into a natural branching inflorescence instead of four repeated icons.
    for (let bud = 0; bud < 7; bud++) {
      const a = bud * 2.399,
        base = V(0, 1.35 + bud * 0.11, 0),
        tip = V(Math.cos(a) * 0.28, 1.65 + bud * 0.12, Math.sin(a) * 0.24);
      tube(
        [
          base,
          base
            .clone()
            .lerp(tip, 0.5)
            .add(V(0, 0.07, 0)),
          tip,
        ],
        0.008,
      );
      const points = [];
      for (let j = 0; j <= 12; j++) {
        const t = j / 12;
        points.push(
          new THREE.Vector2(
            0.065 * Math.pow(Math.sin(t * Math.PI), 0.8),
            t * 0.25,
          ),
        );
      }
      add(
        new THREE.LatheGeometry(points, 12),
        "crown",
        bud % 2 ? "#627aaf" : "#3d578a",
        tip,
        new THREE.Quaternion().setFromUnitVectors(
          V(0, 1, 0),
          V(Math.cos(a) * 0.4, 0.7, Math.sin(a) * 0.4).normalize(),
        ),
      );
    }
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4;
      leaf(
        V(0, 0.22 + i * 0.16, 0),
        V(Math.cos(a), 0.15, Math.sin(a)),
        0.72,
        0.08,
        leafColor,
        0.25,
      );
    }
  }
  // Shared tonal leaf tissue plus branching veins: geometry gives the silhouette,
  // this surface supplies small-scale botanical variation rather than plastic fill.
  const size=256,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/(size-1),v=y/(size-1),d=Math.abs(u-.5),i=(y*size+x)*4;
    const hash=Math.sin(x*127.1+y*311.7)*43758.5453,noise=hash-Math.floor(hash);
    const rib=Math.exp(-d*230),phase=(v-d*.58)*10,branch=Math.exp(-Math.pow(Math.sin(phase*Math.PI)*d*30,2));
    const fine=Math.pow(Math.max(0,Math.cos(v*240+d*90)),18)*d;
    const mottling=Math.sin(u*31+v*19)*Math.sin(v*57-u*11)*9;
    const value=Math.min(255,199+rib*39+branch*22+fine*20+mottling+noise*13);
    pixels[i]=value;pixels[i+1]=value;pixels[i+2]=value*.94;pixels[i+3]=255;
  }
  const surface=new THREE.DataTexture(pixels,size,size);surface.needsUpdate=true;surface.colorSpace=THREE.SRGBColorSpace;surface.wrapS=surface.wrapT=THREE.RepeatWrapping;surface.magFilter=THREE.LinearFilter;surface.minFilter=THREE.LinearFilter;
  const group = new THREE.Group();
  group.name = `herb-${kind}`;
  for (const [bucket, parts] of Object.entries(buckets)) {
    if (!parts.length) continue;
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: bucket === "leaf" || bucket === "crown" ? surface : null,
      bumpMap: bucket === "leaf" || bucket === "crown" ? surface : null,
      bumpScale: 0.022,
      roughness: bucket === "dew" ? 0.12 : bucket === "crown" ? 0.85 : 0.9,
      metalness: bucket === "dew" ? 0.25 : 0,
      side: THREE.DoubleSide,
    });
    const geometry = merge(parts);
    const col = geometry.getAttribute("color"),
      pos = geometry.getAttribute("position");
    for (let i = 0; i < col.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const variation =
        0.9 +
        0.1 * Math.sin(x * 37 + y * 23 + z * 19) * Math.cos(y * 57 - z * 31);
      col.setXYZ(
        i,
        col.getX(i) * variation,
        col.getY(i) * variation,
        col.getZ(i) * variation,
      );
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.kind = kind;
  group.userData.surface = surface;
  return group;
}
export function disposeHerbModel(model) {
  model.userData.surface?.dispose();
  model.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) [].concat(o.material).forEach((m) => m.dispose());
  });
}
