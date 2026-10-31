import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import "./Tabletop3D.css";
import { createHerbModel, disposeHerbModel } from "./HerbModels";
import HerbViewer from "./HerbViewer";
import HerbCatalog from "./HerbCatalog";
import OpeningDeal from "./OpeningDeal";
import TreasureChest from "./TreasureChest";
import { createCardPose, touchCardPose, tableLayout } from "./cardPlacement";
import {
  ALL_HERB_ART,
  combinationSpecimens,
  HERB_GROUPS,
  herbForCard,
  herbImage,
  herbsInGroup,
} from "./herbSpecies";

const HERBS = {
  red: "紅組",
  yellow: "黃組",
  green: "綠組",
  blue: "藍組",
};
const pairArt = [
  "red-yellow",
  "green-red",
  "blue-red",
  "green-yellow",
  "blue-yellow",
  "blue-green",
].map((id) => ({
  id: `pair-${id}`,
  pair: id === "blue-red" ? "blue-red-starter" : id,
}));
const imageCache = new Map();
function loadArt(herb) {
  const color = herb.id;
  if (!imageCache.has(color))
    imageCache.set(
      color,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          imageCache.delete(color);
          resolve(null);
        };
        img.src = herb.pair
          ? `${process.env.PUBLIC_URL}/images/herbs/pairs/${herb.pair}.webp`
          : herbImage(herb);
      }),
    );
  return imageCache.get(color);
}
function cardTexture(
  colors,
  title,
  images,
  back = false,
  botanical = false,
  count = null,
  specimens = [],
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 744;
  const ctx = canvas.getContext("2d");
  const rounded = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const paper = ctx.createLinearGradient(0, 0, 512, 744);
  paper.addColorStop(0, "#f5ecd5");
  paper.addColorStop(0.45, "#e9ddbf");
  paper.addColorStop(1, "#c9b88c");
  ctx.fillStyle = paper;
  rounded(0, 0, 512, 744, 24);
  ctx.fill();
  if (!back) {
    // Fine laid-paper texture and bevel, authored as native game material.
    for (let y = 20; y < 730; y += 4) {
      ctx.strokeStyle = y % 8 ? "#72593006" : "#fff8dc12";
      ctx.beginPath();
      ctx.moveTo(18, y);
      ctx.lineTo(494, y);
      ctx.stroke();
    }
    const pairImage =
      colors.length > 1 ? images[`pair-${[...colors].sort().join("-")}`] : null;
    if (pairImage && !botanical) {
      const scale = Math.min(452 / pairImage.width, 510 / pairImage.height);
      ctx.drawImage(
        pairImage,
        (512 - pairImage.width * scale) / 2,
        84 + (510 - pairImage.height * scale) / 2,
        pairImage.width * scale,
        pairImage.height * scale,
      );
    }
    colors.forEach((c, i) => {
      const herb = specimens[i] || herbsInGroup(c)[0];
      const img = images[herb.id],
        group = HERB_GROUPS[c];
      const w = 440 / colors.length,
        x = 36 + i * w;
      if (img && !botanical && !pairImage) {
        const scale = Math.min((w - 8) / img.width, 510 / img.height);
        ctx.drawImage(
          img,
          x + (w - img.width * scale) / 2,
          84 + (510 - img.height * scale) / 2,
          img.width * scale,
          img.height * scale,
        );
      }
      // Open specimen composition: no table columns or banner blocks.
      const badgeX = colors.length === 1 ? 66 : i === 0 ? 66 : 446;
      ctx.fillStyle = group.ink;
      ctx.textAlign = "center";
      ctx.font = "bold 40px serif";
      ctx.fillText(group.symbol, badgeX, 72);
      ctx.font = "600 24px serif";
      ctx.fillText(group.name[0], badgeX, 103);
    });
    const fade = ctx.createLinearGradient(0, 600, 0, 628);
    fade.addColorStop(0, "#e4d6b600");
    fade.addColorStop(1, "#e4d6b6");
    ctx.fillStyle = fade;
    ctx.fillRect(32, 600, 448, 28);
    ctx.fillStyle = "#e4d6b6";
    ctx.fillRect(32, 628, 448, 82);
    ctx.strokeStyle = "#9c7c43";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 618);
    ctx.lineTo(220, 618);
    ctx.moveTo(292, 618);
    ctx.lineTo(442, 618);
    ctx.stroke();
    ctx.save();
    ctx.translate(256, 618);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#90713f";
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
    ctx.textAlign = "center";
    ctx.fillStyle = "#283a2d";
    ctx.font = "600 53px serif";
    if (colors.length === 1) ctx.fillText(title, 256, 682);
    ctx.font = "18px serif";
    ctx.fillStyle = "#74623f";
    ctx.fillText("H E R B A L I S M", 256, 715);
  } else {
    const g = ctx.createRadialGradient(256, 350, 20, 256, 350, 440);
    g.addColorStop(0, "#28423c");
    g.addColorStop(1, "#0a1717");
    ctx.fillStyle = g;
    ctx.fillRect(12, 12, 488, 720);
    ctx.strokeStyle = "#a88f5f";
    ctx.lineWidth = 1.5;
    // Symmetric botanical tooling, authored as native canvas ornament.
    for (const side of [-1, 1])
      for (let stem = 0; stem < 3; stem++) {
        ctx.save();
        ctx.translate(256, 380);
        ctx.scale(side, 1);
        ctx.rotate((stem - 1) * 0.25);
        ctx.beginPath();
        ctx.moveTo(50, 205);
        ctx.bezierCurveTo(210, 110, 165, -125, 55, -220);
        ctx.stroke();
        for (let i = 0; i < 9; i++) {
          const t = i / 8,
            y = 165 - t * 335,
            x = 80 + Math.sin(t * Math.PI) * 83;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + 36, y - 32, x + 48, y - 9, x, y + 9);
          ctx.bezierCurveTo(x - 28, y - 10, x - 27, y - 28, x, y);
          ctx.stroke();
        }
        ctx.restore();
      }
    ctx.fillStyle = "#132620";
    ctx.beginPath();
    ctx.ellipse(256, 358, 84, 125, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cfb77a";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#e6d4a6";
    ctx.font = "52px serif";
    ctx.fillText("本", 256, 339);
    ctx.fillText("草", 256, 405);
    ctx.font = "16px serif";
    ctx.fillText("H E R B A L I S M", 256, 523);
  }
  // Dark card stock edge, warm foil line, and inset hairline create a crafted object.
  ctx.strokeStyle = "#49391f";
  ctx.lineWidth = 15;
  rounded(8, 8, 496, 728, 20);
  ctx.stroke();
  const foil = ctx.createLinearGradient(0, 0, 512, 744);
  [[0, '#6e4a1d'], [.16, '#f5df9c'], [.3, '#bd8b3a'], [.46, '#fff0bb'], [.6, '#a1702b'], [.82, '#e8cb7a'], [1, '#725022']]
    .forEach(([stop, color]) => foil.addColorStop(stop, color));
  ctx.strokeStyle = foil;
  ctx.lineWidth = 10;
  rounded(17, 17, 478, 710, 15);
  ctx.stroke();
  ctx.strokeStyle = "#85612f";
  ctx.lineWidth = 1.5;
  rounded(27, 27, 458, 690, 10);
  ctx.stroke();
  ctx.strokeStyle = '#fff4ceaa';
  ctx.lineWidth = 1;
  rounded(31, 31, 450, 682, 8);
  ctx.stroke();
  for (const [x, y, rotation] of [
    [34, 34, 0],
    [478, 34, Math.PI / 2],
    [478, 710, Math.PI],
    [34, 710, -Math.PI / 2],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = foil;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(0, 0);
    ctx.lineTo(34, 0);
    ctx.moveTo(7, 25);
    ctx.quadraticCurveTo(9, 9, 25, 7);
    ctx.moveTo(4, 42);
    ctx.bezierCurveTo(22, 33, 13, 15, 42, 4);
    ctx.moveTo(12, 26);
    ctx.quadraticCurveTo(30, 30, 26, 12);
    ctx.stroke();
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
const ignoreReady = () => {};
export default function Tabletop3D({
  players,
  hand,
  myId,
  currentIndex,
  combos,
  lastCombo,
  canAsk,
  canGuess,
  onAsk,
  onGuess,
  onReady = ignoreReady,
  result,
  waitingAction,
  readOnly = false,
  actionContent = null,
  replayAction = null,
}) {
  const mount = useRef(null),
    api = useRef(null),
    latest = useRef({}),
    placements = useRef(new Map()),
    openingLaid = useRef(false);
  const tray = useRef(null);
  const [trayHeight, setTrayHeight] = useState(172);
  useEffect(() => {
    if (!tray.current) return;
    const update = () => setTrayHeight(Math.ceil(tray.current.getBoundingClientRect().height) + 8);
    if (typeof ResizeObserver === 'undefined') {
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(tray.current);
    update();
    return () => observer.disconnect();
  }, []);
  const [botanical, setBotanical] = useState(false);
  const [ambience, setAmbience] = useState(() => {
    try { return window.localStorage.getItem('herbalism-table-ambience') !== 'off'; }
    catch { return true; }
  });
  const toggleAmbience = () => setAmbience(previous => {
    const next = !previous;
    try { window.localStorage.setItem('herbalism-table-ambience', next ? 'on' : 'off'); } catch {}
    return next;
  });
  const [labels, setLabels] = useState([]);
  const [openingRecipients, setOpeningRecipients] = useState(null);
  const [treasureReady, setTreasureReady] = useState(false);
  const [sealing, setSealing] = useState(false);
  const finishSealing = useCallback(() => setSealing(false), []);
  const [viewHerb, setViewHerb] = useState(null);
  const [catalog, setCatalog] = useState(false);
  const [catalogHerb, setCatalogHerb] = useState(null);
  const [handGroup, setHandGroup] = useState(null);
  const closeHand = useCallback(() => setHandGroup(null), []);
  const [selected, setSelected] = useState(null),
    [failed, setFailed] = useState(false);
  latest.current = {
    players,
    hand,
    myId,
    currentIndex,
    combos,
    lastCombo,
    canAsk,
    canGuess,
    onAsk,
    onGuess,
    replayAction,
    selected,
  };
  // Rebuild only the small game-object group; renderer, camera and loaded art remain stable.
  const signature = JSON.stringify([
    players.map((p) => [p.id, p.name, p.score, p.hand?.length, p.difficulty]),
    hand.map((c) => [c.id, c.color]),
    currentIndex,
    lastCombo,
    canAsk,
    replayAction,
  ]);
  useEffect(() => {
    api.current?.rebuild();
  }, [signature]);
  useEffect(() => {
    const host = mount.current;
    if (!host || failed) return;
    if (typeof WebGL2RenderingContext === "undefined") {
      onReady(false);
      setFailed(true);
      return;
    }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch (e) {
      onReady(false);
      setFailed(true);
      return;
    }
    let dead = false,
      frame = 0,
      images = {},
      artReady = false,
      selectedMesh = null,
      objects = [],
      zoom = 1;
    let layout = tableLayout(host.clientWidth, host.clientHeight);
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const movements = new Map();
    const scene = new THREE.Scene();
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute(
      "aria-label",
      "3D 牌桌：點選問牌卡，底部確認；桌面視角固定",
    );
    host.appendChild(renderer.domElement);
    const camera = new THREE.OrthographicCamera(-7, 7, 8, -8, 0.1, 100);
    camera.position.set(0, 24, 8);
    camera.lookAt(0, 0, 0);
    const ambient = new THREE.HemisphereLight("#e5ead8", "#121510", 2);
    scene.add(ambient);
    const light = new THREE.DirectionalLight("#ffe5b8", 3);
    light.position.set(-5, 14, 7);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -12;
    light.shadow.camera.right = 12;
    light.shadow.camera.top = 12;
    light.shadow.camera.bottom = -12;
    light.shadow.bias = -0.001;
    scene.add(light);
    const rim = new THREE.DirectionalLight("#8bb4bb", 1.5);
    rim.position.set(7, 6, -7);
    scene.add(rim);
    const surfaceTexture = new THREE.TextureLoader().load(
      `${process.env.PUBLIC_URL}/images/tabletop/apothecary-table.webp`,
      () => {
        if (!dead) {
          table.material.opacity = 1;
          draw();
        }
      },
    );
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    surfaceTexture.anisotropy = 4;
    const table = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshStandardMaterial({
        map: surfaceTexture,
        roughness: 0.94,
        transparent: true,
        opacity: 0,
      }),
    );
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.02;
    table.receiveShadow = true;
    scene.add(table);
    const herbModels = botanical
      ? Object.fromEntries(
          Object.keys(HERBS).map((c) => [c, createHerbModel(c)]),
        )
      : {};
    const content = new THREE.Group();
    scene.add(content);
    const disposeGroup = () => {
      const textures = new Set();
      content.traverse((o) => {
        if (o.userData.sharedHerb) return;
        o.geometry?.dispose();
        if (o.material) {
          for (const m of [].concat(o.material)) {
            if (m.map) textures.add(m.map);
            m.dispose();
          }
        }
      });
      textures.forEach((t) => t.dispose());
      content.clear();
    };
    const draw = () => {
      if (dead) return;
      renderer.render(scene, camera);
      setLabels(
        objects
          .filter((mesh) => !mesh.userData.dealing)
          .map((mesh) => {
            const p = new THREE.Vector3(0, 0.09, 1.02)
              .applyMatrix4(mesh.matrixWorld)
              .project(camera);
            return {
              id: mesh.userData.combo.id,
              colors: mesh.userData.combo.colors,
              corners: [
                [-0.9, -1.31],
                [0.9, -1.31],
                [0.9, 1.31],
                [-0.9, 1.31],
              ]
                .map(([x, z]) => {
                  const q = new THREE.Vector3(x, 0.09, z)
                    .applyMatrix4(mesh.matrixWorld)
                    .project(camera);
                  return `${(q.x * 0.5 + 0.5) * 100},${(-q.y * 0.5 + 0.5) * 100}`;
                })
                .join(" "),
              name: mesh.userData.combo.name,
              x: (p.x * 0.5 + 0.5) * 100,
              y: (-0.5 * p.y + 0.5) * 100,
              disabled: mesh.userData.disabled,
              selected: mesh === selectedMesh,
            };
          }),
      );
    };
    // Render only while a short physical movement is active; no idle WebGL loop.
    const animate = (now) => {
      frame = 0;
      if (dead) return;
      movements.forEach((motion, mesh) => {
        const t = THREE.MathUtils.clamp(
          (now - motion.start) / motion.duration,
          0,
          1,
        );
        const ease = 1 - Math.pow(1 - t, 3);
        mesh.position.lerpVectors(motion.from, motion.to, ease);
        mesh.position.y += Math.sin(Math.PI * t) * motion.arc;
        mesh.rotation.x = Math.sin(Math.PI * t) * motion.rock;
        mesh.rotation.z = Math.sin(Math.PI * t) * motion.rock * 0.6;
        mesh.rotation.y = THREE.MathUtils.lerp(
          motion.fromAngle,
          motion.angle,
          ease,
        );
        if (t === 1) {
          mesh.userData.dealing = false;
          movements.delete(mesh);
          motion.onRest?.();
        }
      });
      draw();
      if (movements.size) frame = requestAnimationFrame(animate);
      else
        renderer.domElement.setAttribute(
          "aria-label",
          "3D 牌桌：點選問牌卡，底部確認；桌面視角固定",
        );
    };
    const moveCard = (mesh, pose, height, delay = 0) => {
      const to = new THREE.Vector3(pose.x, height, pose.z);
      if (reducedMotion) {
        movements.delete(mesh);
        mesh.position.copy(to);
        mesh.rotation.y = pose.angle;
        mesh.rotation.x = mesh.rotation.z = 0;
        mesh.userData.dealing = false;
        return;
      }
      movements.set(mesh, {
        start: performance.now() + delay,
        duration: pose.duration || 320,
        arc: pose.arc || 0.04,
        rock: pose.rock || 0,
        onRest: pose.onRest,
        from: mesh.position.clone(),
        to,
        fromAngle: mesh.rotation.y,
        angle: pose.angle,
      });
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const addCard = (
      colors,
      title,
      x,
      z,
      angle = 0,
      back = false,
      count = null,
      specimens = [],
    ) => {
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(1.8, 0.065, 2.62, 3, 0.03),
        [
          new THREE.MeshStandardMaterial({ color: "#c7a45e", metalness: .72, roughness: .28 }),
          new THREE.MeshStandardMaterial({ color: "#c7a45e", metalness: .72, roughness: .28 }),
          new THREE.MeshStandardMaterial({
            map: cardTexture(
              colors,
              title,
              images,
              back,
              botanical,
              count,
              specimens,
            ),
            roughness: 0.63,
            metalness: 0.03,
          }),
          new THREE.MeshStandardMaterial({ color: "#10271f" }),
          new THREE.MeshStandardMaterial({ color: "#c7a45e", metalness: .72, roughness: .28 }),
          new THREE.MeshStandardMaterial({ color: "#c7a45e", metalness: .72, roughness: .28 }),
        ],
      );
      mesh.position.set(x, 0.07, z);
      mesh.rotation.y = angle;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      content.add(mesh);
      if (botanical && !back)
        colors.forEach((color, i) => {
          const model = herbModels[color].clone(true);
          model.traverse((o) => {
            o.userData.sharedHerb = true;
          });
          model.scale.setScalar(colors.length > 1 ? 0.62 : 0.78);
          model.position.set(
            colors.length > 1 ? (i - 0.5) * 0.66 : 0,
            0.06,
            0.2,
          );
          model.rotation.y = (i - 0.5) * 0.6;
          model.rotation.x = -0.55;
          mesh.add(model);
        });
      return mesh;
    };
    const rebuild = () => {
      if (dead || !artReady) return;
      cancelAnimationFrame(frame);
      frame = 0;
      movements.clear();
      disposeGroup();
      objects = [];
      selectedMesh = null;
      setSelected(null);
      const s = latest.current;
      const dealOpening = !openingLaid.current;
      openingLaid.current = true;
      s.combos.forEach((combo, i) => {
        if (!placements.current.has(combo.id))
          placements.current.set(combo.id, createCardPose(i, Math.random, layout.columns));
        const pose = placements.current.get(combo.id);
        const mesh = addCard(
          combo.colors,
          combo.name,
          pose.x,
          pose.z,
          pose.angle,
          false,
          null,
          combinationSpecimens(combo.colors),
        );
        mesh.scale.setScalar(1.35);
        mesh.userData.combo = combo;
        mesh.userData.disabled = !readOnly && (!s.canAsk || combo.id === s.lastCombo);
        if (mesh.userData.disabled) mesh.material[2].color.set("#bec3b6");
        objects.push(mesh);
        if (readOnly && s.replayAction?.type === 'questionAsked' &&
            combo.colors.every(color => s.replayAction.colors?.includes(color))) {
          selectedMesh = mesh;
          mesh.position.y = 0.32;
        }
        if (!readOnly && s.selected?.id === combo.id && !mesh.userData.disabled) {
          selectedMesh = mesh;
          mesh.position.y = 0.32;
          setSelected(combo);
        }
        if (dealOpening && !reducedMotion) {
          mesh.userData.dealing = true;
          renderer.domElement.setAttribute(
            "aria-label",
            "正在逐張擺放六張問牌卡",
          );
          mesh.position.set(
            (Math.random() - 0.5) * 0.8,
            0.8 + Math.random() * 0.4,
            5.7 + Math.random() * 0.4,
          );
          mesh.rotation.y = (Math.random() - 0.5) * 0.7;
          moveCard(
            mesh,
            {
              ...pose,
              duration: 900 + Math.random() * 200,
              arc: 0.15 + Math.random() * 0.2,
              rock: (Math.random() - 0.5) * 0.1,
            },
            0.07,
            i * 140,
          );
        }
      });
      // Own cards are rendered as real specimen fans in the hand tray, not duplicated in the scene.
      if (dealOpening && !readOnly && !reducedMotion && s.combos.length) {
        setSealing(true);
        setOpeningRecipients(s.players.filter(player => player.id !== s.myId));
      }
      draw();
    };
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      const nextLayout = tableLayout(w, h);
      const reflow = nextLayout.columns !== layout.columns;
      layout = nextLayout;
      camera.left = -layout.halfWidth;
      camera.right = layout.halfWidth;
      camera.top = layout.halfHeight;
      camera.bottom = -layout.halfHeight;
      table.scale.set(layout.halfWidth * 2.25, layout.halfHeight * 2.4, 1);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      if (reflow) {
        placements.current.clear();
        rebuild();
      } else draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let start = null;
    const down = (e) => {
      start = { x: e.clientX, y: e.clientY };
      host.setPointerCapture?.(e.pointerId);
    };
    const up = (e) => {
      if (!start || readOnly) return;
      const dx = e.clientX - start.x,
        dy = e.clientY - start.y;
      start = null;
      if (Math.hypot(dx, dy) > 12) {
        // A swipe is not a card tap. Keep the table and camera completely fixed.
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(objects, true);
      let hit = hits[0]?.object;
      while (hit && !objects.includes(hit)) hit = hit.parent;
      if (selectedMesh) {
        moveCard(
          selectedMesh,
          placements.current.get(selectedMesh.userData.combo.id),
          0.07,
        );
        selectedMesh = null;
      }
      if (!readOnly && hit && !hit.userData.disabled && !hit.userData.dealing) {
        selectedMesh = hit;
        const pose = touchCardPose(
          placements.current.get(hit.userData.combo.id),
          Math.random,
          hit.worldToLocal(hits[0].point.clone()),
        );
        placements.current.set(hit.userData.combo.id, pose);
        moveCard(hit, pose, 0.32);
        setSelected(hit.userData.combo);
        latest.current.onAsk(hit.userData.combo);
      } else setSelected(null);
      draw();
    };
    const cancel = () => {
      start = null;
    };
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointerup", up);
    host.addEventListener("pointercancel", cancel);
    const contextLost = (e) => {
      e.preventDefault();
      onReady(false);
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    api.current = {
      rebuild,
      selectCombo: (combo) => {
        if (readOnly || !latest.current.canAsk) return;
        const mesh = objects.find(object => object.userData.combo.id === combo.id);
        if (!mesh || mesh.userData.disabled || mesh.userData.dealing) return;
        if (selectedMesh && selectedMesh !== mesh) {
          moveCard(selectedMesh, placements.current.get(selectedMesh.userData.combo.id), 0.07);
        }
        selectedMesh = mesh;
        moveCard(mesh, placements.current.get(combo.id), 0.32);
        setSelected(mesh.userData.combo);
        draw();
        latest.current.onAsk(mesh.userData.combo);
      },
      zoom: (delta) => {
        zoom = THREE.MathUtils.clamp(zoom + delta, 0.75, 1.5);
        resize();
      },
    };
    Promise.all(
      [...ALL_HERB_ART, ...pairArt].map(async (herb) => {
        images[herb.id] = await loadArt(herb);
      }),
    ).then(() => {
      if (dead) return;
      artReady = true;
      rebuild();
      resize();
      onReady(true);
      // Loaded and resized synchronously; idle rendering remains stopped.
    });
    resize();
    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      api.current = null;
      disposeGroup();
      Object.values(herbModels).forEach(disposeHerbModel);
      table.geometry.dispose();
      table.material.dispose();
      surfaceTexture.dispose();
      light.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onReady, failed, botanical, readOnly]);
  if (failed)
    return (
      <div className="tabletop-fallback" role="note">
        3D 暫不可用，已保留可操作的牌桌。
      </div>
    );
  return (
    <section
      className={`tabletop3d ${ambience ? 'tabletop3d--ambient' : ''}`}
      aria-label="3D 本草牌桌"
      style={{
        "--apothecary-surface": `url(${process.env.PUBLIC_URL}/images/tabletop/apothecary-table.webp)`,
        "--tabletop-tray-height": `${trayHeight}px`,
      }}
    >
      {catalog && (
        <HerbCatalog
          initialHerb={catalogHerb}
          onClose={() => {
            setCatalog(false);
            setCatalogHerb(null);
          }}
        />
      )}
      {handGroup !== null && (
        <HerbCatalog
          handCards={hand}
          initialGroup={handGroup}
          onClose={closeHand}
        />
      )}
      {viewHerb && (
        <HerbViewer initialColor={viewHerb} onClose={() => setViewHerb(null)} />
      )}
      <div className="tabletop3d-canvas" ref={mount} />
      {openingRecipients && treasureReady && <OpeningDeal players={openingRecipients} sealedCount={2} onSealed={finishSealing} />}
      {ambience && <div className="tabletop3d-ambience" aria-hidden="true">
        <div className="tabletop3d-lightwash" />
        {Array.from({length: 10}, (_, i) => <i key={i} style={{'--mote-x': `${7 + (i * 29) % 88}%`, '--mote-delay': `${-i * 2.7}s`, '--mote-duration': `${15 + i % 4 * 3}s`}} />)}
      </div>}
      <div className="tabletop3d-labels" aria-hidden="true">
        {labels.map((label) => (
          <span
            key={label.id}
            className={`${label.disabled ? "disabled" : ""} ${label.selected ? "selected" : ""}`}
            style={{ left: `${label.x}%`, top: `${label.y}%` }}
          >
            {label.selected ? "✓ " : ""}
            {label.name}
          </span>
        ))}
      </div>
      <TreasureChest open={sealing} canGuess={canGuess} readOnly={readOnly}
        onGuess={onGuess} onReady={setTreasureReady} />
      <div className="tabletop3d-top">
        <details className="tabletop3d-view">
          <summary aria-label="牌桌顯示設定">顯示</summary>
          <div>
            <button onClick={toggleAmbience} aria-pressed={ambience}>
              牌桌動態：{ambience ? '開' : '關'}
            </button>
            <button
              onClick={() => {
                setCatalogHerb(null);
                setCatalog(true);
              }}
              aria-label="開啟草藥圖鑑"
            >
              草藥圖庫
            </button>
            <button onClick={() => setViewHerb(selected?.colors?.[0] || "red")}>
              舊版 3D 標本
            </button>
            <button
              onClick={() => setBotanical((v) => !v)}
              aria-pressed={botanical}
            >
              {botanical ? "改用插畫" : "試看立體草藥"}
            </button>
            <button
              onClick={() => api.current?.zoom(-0.1)}
              aria-label="縮小牌桌"
            >
              −
            </button>
            <button
              onClick={() => api.current?.zoom(0.1)}
              aria-label="放大牌桌"
            >
              ＋
            </button>
          </div>
        </details>
      </div>
      {result && (
        <div className="tabletop3d-result" role="alert">
          {result}
        </div>
      )}
      <div className="tabletop3d-seats" aria-label="玩家與分數">
        {players.map((p, i) => (
          <div
            key={p.id}
            data-player-id={p.id}
            className={`tabletop-seat ${i === currentIndex ? "active" : ""} ${p.isActive === false ? "retired" : ""} ${readOnly && replayAction?.targetPlayerId === p.id ? "replay-target" : ""}`}
          >
            <span className="tabletop-seat-avatar" aria-hidden="true">
              {Array.from(p.name || "客")[0]}
            </span>
            <div className="tabletop-seat-info">
              <strong>
                {p.name}
                {p.id === myId && <span className="seat-self-marker"> · 我</span>}
              </strong>
              <small>
                {p.isActive === false
                  ? `停止主動行動 · ${p.hand?.length || 0} 張`
                  : `${p.hand?.length || 0} 張手牌`}
                {p.difficulty
                  ? ` · ${{ easy: "簡單", medium: "中等", hard: "困難" }[p.difficulty]}`
                  : ""}
              </small>
            </div>
            <span
              className="tabletop-seat-score"
              aria-label={`${p.score || 0} 分`}
            >
              {p.score || 0}
              <small>分</small>
            </span>
          </div>
        ))}
      </div>
      <div className="tabletop3d-actions" ref={tray}>
        <div
          className="tabletop3d-hand-groups"
          aria-label={`我的手牌，共 ${hand.length} 張`}
        >
          {Object.entries(HERB_GROUPS).map(([color, group]) => {
            const cards = hand.filter((card) => card.color === color);
            const specimens = cards.map(herbForCard).filter(Boolean);
            return (
              <button
                key={color}
                data-hand-color={color}
                disabled={!cards.length}
                onClick={() => setHandGroup(color)}
                style={{
                  "--herb-accent": group.ink,
                  "--herb-glow": group.glow,
                }}
                aria-label={`查看${group.name}手牌，共 ${cards.length} 張`}
              >
                <span className="hand-specimen-fan" aria-hidden="true" data-count={cards.length}>
                  {specimens.map((herb, index) => (
                    <img key={`${herb.id}-${index}`} src={herbImage(herb)} alt=""
                      style={{ "--card-index": index, "--card-total": specimens.length }} />
                  ))}
                  {!cards.length && <span className="hand-empty">—</span>}
                </span>
                <span className="hand-group-label">
                  <small>
                    {group.symbol} {group.name}
                  </small>
                  <strong>×{cards.length}</strong>
                </span>
              </button>
            );
          })}
        </div>
        {readOnly ? actionContent : <>
        <div className="tabletop3d-caption">
          {waitingAction
            ? "玩家就座後，由房主開始發牌"
            : selected
              ? `${selected.colors.map((c) => HERBS[c]).join(" · ")}`
              : canAsk
                ? hand.length > 4
                  ? `${hand.length} 張手牌 · 點色組查看`
                  : "選擇兩個色組，探問線索"
                : players.find((p) => p.id === myId)?.isActive === false
                  ? "本局停止主動行動；仍須回應問牌與交牌"
                  : canGuess ? "僅剩你可猜牌 · 請立即猜測藥方" : `等待 ${players[currentIndex]?.name || "其他玩家"} 行動`}
        </div>
        <div
          className="tabletop3d-buttons"
          style={{
            "--action-glow": selected
              ? HERB_GROUPS[selected.colors[0]].glow
              : "#d6b86c",
          }}
        >
          {waitingAction}
        </div>
        {!waitingAction && (
          <details className="tabletop3d-access">
            <summary>快捷選牌</summary>
            <div>
              {combos.map((c) => (
                <button
                  key={c.id}
                  aria-label={c.name}
                  aria-pressed={selected?.id === c.id}
                  disabled={!canAsk || c.id === lastCombo}
                  onClick={() => api.current?.selectCombo(c)}
                >
                  <span className="quick-color-pair" aria-hidden="true">
                    {c.colors.map(color => <i key={color} className={`quick-color quick-color-${color}`}>{HERB_GROUPS[color].symbol}</i>)}
                  </span>
                </button>
              ))}
            </div>
          </details>
        )}
        </>}
      </div>
    </section>
  );
}
