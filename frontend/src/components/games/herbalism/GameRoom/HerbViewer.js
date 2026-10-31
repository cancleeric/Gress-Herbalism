import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createHerbModel, disposeHerbModel } from "./HerbModels";
import { HERB_NAMES } from "./HerbArt";
import "./HerbViewer.css";

export default function HerbViewer({ initialColor = "red", onClose }) {
  const [color, setColor] = useState(initialColor),
    [painting, setPainting] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const host = useRef(null),
    close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    return () => previous?.focus?.();
  }, []);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = Array.from(
          close.current.closest('[role="dialog"]').querySelectorAll("button"),
        );
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  useEffect(() => {
    if (painting) return;
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    camera.position.set(0, 1.5, 5.7);
    camera.lookAt(0, 1.35, 0);
    scene.add(new THREE.HemisphereLight(0xdfeef9, 0x28352b, 2));
    const key = new THREE.DirectionalLight(0xffe7c6, 2.5);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9dc6f2, 1.8);
    rim.position.set(-3, 3, -2);
    scene.add(rim);
    const model = createHerbModel(color);
    model.rotation.y = -0.35;
    scene.add(model);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.72, 0.045, 48),
      new THREE.MeshStandardMaterial({
        color: 0x756344,
        metalness: 0.7,
        roughness: 0.4,
      }),
    );
    base.position.y = -0.04;
    scene.add(base);
    const draw = () => renderer.render(scene, camera);
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    let pointer = null;
    const down = (e) => {
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!pointer) return;
      model.rotation.y += (e.clientX - pointer.x) * 0.012;
      model.rotation.x = THREE.MathUtils.clamp(
        model.rotation.x + (e.clientY - pointer.y) * 0.004,
        -0.3,
        0.3,
      );
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      draw();
    };
    const up = () => {
      pointer = null;
    };
    const canvas = renderer.domElement;
    const contextLost = (e) => {
      e.preventDefault();
      setUnavailable(true);
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      disposeHerbModel(model);
      base.geometry.dispose();
      base.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [color, painting]);
  return (
    <div
      className="herb-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="草藥立體圖鑑"
    >
      <header>
        <div>
          <small>BOTANICAL ATELIER</small>
          <h2>{HERB_NAMES[color]}</h2>
        </div>
        <button ref={close} onClick={onClose} aria-label="關閉草藥圖鑑">
          關閉
        </button>
      </header>
      <div className="herb-viewer-stage">
        {painting ? (
          <img
            src={`${process.env.PUBLIC_URL}/images/herbs/${color}.webp`}
            alt={`${HERB_NAMES[color]}牌面插畫`}
          />
        ) : (
          <div
            ref={host}
            className="herb-viewer-canvas"
            aria-label={`${HERB_NAMES[color]}立體標本，拖曳旋轉`}
          />
        )}
        {unavailable && !painting && (
          <p>目前無法顯示立體標本，請切換牌面插畫。</p>
        )}
      </div>
      <footer>
        <p>{painting ? "牌面插畫" : "拖曳標本 · 旋轉查看枝葉與花果"}</p>
        <nav aria-label="選擇草藥">
          {Object.entries(HERB_NAMES).map(([c, name]) => (
            <button
              key={c}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            >
              {name}
            </button>
          ))}
        </nav>
        <button
          className="herb-viewer-compare"
          aria-pressed={painting}
          onClick={() => setPainting((v) => !v)}
        >
          {painting ? "查看 3D 標本" : "比較牌面插畫"}
        </button>
      </footer>
    </div>
  );
}
