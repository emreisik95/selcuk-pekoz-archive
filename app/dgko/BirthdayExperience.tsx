"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { BirthdayYearStats } from "@/lib/dgko-year";
import {
  getFilmFrame,
  getRenderProfile,
  getTunnelPanelDepth,
} from "@/lib/dgko-timeline";

export type BirthdayShort = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
};

type Props = {
  shorts: BirthdayShort[];
  yearStats: BirthdayYearStats;
};

type SceneRuntime = {
  ready: Promise<void>;
  render: (elapsed: number, progress: number, travel: number, chapter: string, virtualSeconds: number) => void;
  resize: () => void;
  dispose: () => void;
};

type ChapterCopy = {
  key: string;
  eyebrow: string;
  title: string;
  note: string;
  start: number;
  end: number;
};

type RecapKey =
  | "views"
  | "streams"
  | "hours"
  | "shorts"
  | "active"
  | "streak"
  | "most-viewed"
  | "longest-stream";

const DEFAULT_RECAP_KEYS: RecapKey[] = [
  "views",
  "streams",
  "hours",
  "shorts",
  "active",
  "streak",
  "most-viewed",
  "longest-stream",
];

const ROOM_DEPTH = 600;
const CORRIDOR_NEAR_Z = 12;

function wrapDepth(value: number) {
  return ((((value - CORRIDOR_NEAR_Z) % ROOM_DEPTH) + ROOM_DEPTH) % ROOM_DEPTH) - ROOM_DEPTH + CORRIDOR_NEAR_Z;
}

function wrapDepthWithBuffer(value: number, wrapBuffer: number) {
  const bufferedNearZ = CORRIDOR_NEAR_Z + wrapBuffer;
  return ((((value - bufferedNearZ) % ROOM_DEPTH) + ROOM_DEPTH) % ROOM_DEPTH) - ROOM_DEPTH + bufferedNearZ;
}

function smoothstep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours} sa ${minutes} dk`;
}

function getChapterCopy(seconds: number, stats: BirthdayYearStats): ChapterCopy {
  const number = (value: number) => value.toLocaleString("tr-TR");
  if (seconds < 7) return {
    key: "intro",
    eyebrow: "SELÇUK PEKÖZ",
    title: "SON\n365 GÜN",
    note: `${number(stats.streamCount)} yayın · ${number(stats.shortCount)} Shorts`,
    start: 0,
    end: 7,
  };
  if (seconds < 14) return {
    key: "streams",
    eyebrow: "CANLI YAYINLAR",
    title: `${number(stats.streamCount)}\nYAYIN`,
    note: "Bir yılda açılan canlı yayın sayısı",
    start: 7,
    end: 14,
  };
  if (seconds < 20) return {
    key: "hours",
    eyebrow: "EKRAN BAŞINDA",
    title: `${number(stats.streamHours)}\nSAAT`,
    note: `${number(stats.streamViews)} canlı yayın izlenmesi`,
    start: 14,
    end: 20,
  };
  if (seconds < 27) return {
    key: "streak",
    eyebrow: "EN UZUN YAYIN SERİSİ",
    title: `${number(stats.longestStreakDays)}\nGÜN`,
    note: `${number(stats.activeDays)} farklı günde yayındaydı`,
    start: 20,
    end: 27,
  };
  if (seconds < 34) return {
    key: "shorts",
    eyebrow: "KISA VİDEOLAR",
    title: `${number(stats.shortCount)}\nSHORTS`,
    note: `${number(stats.shortViews)} izlenme`,
    start: 27,
    end: 34,
  };
  if (seconds < 41) return {
    key: "most-viewed",
    eyebrow: "YILIN EN ÇOK İZLENENİ",
    title: number(stats.mostViewed?.views ?? 0),
    note: stats.mostViewed?.title.replace(/\s*#\S+/g, "").slice(0, 92) ?? "",
    start: 34,
    end: 41,
  };
  if (seconds < 47) return {
    key: "longest-stream",
    eyebrow: "EN UZUN YAYIN",
    title: formatDuration(stats.longestStream?.durationSec ?? 0),
    note: stats.longestStream?.title.replace(/^🔴CANLI:\s*/u, "").slice(0, 92) ?? "",
    start: 41,
    end: 47,
  };
  if (seconds < 54) return {
    key: "records",
    eyebrow: "BİR YILA SIĞAN",
    title: number(stats.totalRecords),
    note: "yayın ve kısa video",
    start: 47,
    end: 54,
  };
  if (seconds < 60) return {
    key: "views",
    eyebrow: "HEPSİ BİRLİKTE",
    title: number(stats.totalViews),
    note: "toplam izlenme",
    start: 54,
    end: 60,
  };
  return {
    key: "finale",
    eyebrow: "YENİ YAŞIN KUTLU OLSUN",
    title: "İYİ Kİ DOĞDUN\nSELÇUK PEKÖZ",
    note: "Yeni yaşın; yeni oyunlar, bol kahkaha ve efsane kayıtlarla dolsun.",
    start: 60,
    end: 75,
  };
}

function getRecapItems(stats: BirthdayYearStats) {
  return [
    { key: "views" as const, value: stats.totalViews.toLocaleString("tr-TR"), label: "TOPLAM İZLENME" },
    { key: "streams" as const, value: `${stats.streamCount}`, label: "YAYIN" },
    { key: "hours" as const, value: `${stats.streamHours} SAAT`, label: "CANLI YAYIN" },
    { key: "shorts" as const, value: `${stats.shortCount}`, label: "SHORTS" },
    { key: "active" as const, value: `${stats.activeDays} GÜN`, label: "AKTİF" },
    { key: "streak" as const, value: `${stats.longestStreakDays} GÜN`, label: "EN UZUN SERİ" },
    {
      key: "most-viewed" as const,
      value: (stats.mostViewed?.views ?? 0).toLocaleString("tr-TR"),
      label: "EN ÇOK İZLENEN VİDEO",
    },
    {
      key: "longest-stream" as const,
      value: formatDuration(stats.longestStream?.durationSec ?? 0),
      label: "EN UZUN YAYIN",
    },
  ];
}

async function createShareImage(stats: BirthdayYearStats, selectedKeys: RecapKey[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Paylaşım görseli oluşturulamadı");

  const background = context.createLinearGradient(0, 0, 1080, 1920);
  background.addColorStop(0, "#7567aa");
  background.addColorStop(0.52, "#b67db3");
  background.addColorStop(1, "#f2a57e");
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1920);

  for (let index = 0; index < 34; index += 1) {
    const x = (index * 197 + 83) % 1080;
    const y = (index * 293 + 41) % 1920;
    const colors = ["#ff5c8a", "#55d6be", "#ffd166", "#8ec5ff", "#f49ac2"];
    context.fillStyle = colors[index % colors.length];
    context.save();
    context.translate(x, y);
    context.rotate((index * 0.73) % Math.PI);
    context.fillRect(-8, -20, 16, 40);
    context.restore();
  }

  context.fillStyle = "rgba(75, 56, 119, 0.76)";
  context.beginPath();
  context.roundRect(76, 154, 928, 1540, 72);
  context.fill();
  context.strokeStyle = "rgba(255, 224, 181, 0.84)";
  context.lineWidth = 7;
  context.stroke();

  context.textAlign = "center";
  context.fillStyle = "#fff7e9";
  context.font = "800 68px system-ui";
  context.fillText("SELÇUK’UN SON 365 GÜNÜ", 540, 290);
  context.fillStyle = "#ffd9b0";
  context.font = "800 205px system-ui";
  context.fillText(stats.totalViews.toLocaleString("tr-TR"), 540, 590);
  context.fillStyle = "rgba(255, 247, 233, 0.82)";
  context.font = "700 42px system-ui";
  context.fillText("TOPLAM İZLENME", 540, 662);

  const rows = getRecapItems(stats).filter((item) => selectedKeys.includes(item.key));
  const rowGap = rows.length > 6 ? 108 : 132;
  rows.forEach(({ value, label }, index) => {
    const y = 770 + index * rowGap;
    context.fillStyle = "#fff7e9";
    context.font = rows.length > 6 ? "850 56px system-ui" : "850 66px system-ui";
    context.textAlign = "left";
    context.fillText(value, 180, y);
    context.fillStyle = "rgba(255, 247, 233, 0.68)";
    context.font = rows.length > 6 ? "750 25px system-ui" : "750 29px system-ui";
    context.textAlign = "right";
    context.fillText(label, 900, y - 10);
  });

  context.textAlign = "center";
  context.fillStyle = "#fff7e9";
  context.font = "850 72px system-ui";
  context.fillText("İYİ Kİ DOĞDUN", 540, 1770);
  context.fillStyle = "#ffd1af";
  context.font = "900 92px system-ui";
  context.fillText("SELÇUK PEKÖZ", 540, 1870);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Görsel kaydedilemedi")), "image/png");
  });
  return new File([blob], "selcuk-pekoz-365-gun.png", { type: "image/png" });
}

function normalizeModel(model: THREE.Object3D, targetSize: number, maxAnisotropy: number) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const longestSide = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / longestSide;
  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.envMapIntensity = 0.92;
        material.roughness = Math.max(0.28, material.roughness);
        [
          material.map,
          material.normalMap,
          material.roughnessMap,
          material.metalnessMap,
          material.aoMap,
          material.emissiveMap,
        ].forEach((texture) => {
          if (!texture) return;
          texture.anisotropy = maxAnisotropy;
          texture.needsUpdate = true;
        });
      }
    });
  });
}

function getGroundedModelY(model: THREE.Object3D, groundY: number, anchorScale = 1) {
  const bounds = new THREE.Box3().setFromObject(model);
  return groundY - bounds.min.y * anchorScale;
}

function createCrtMaterial(texture: THREE.VideoTexture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      mediaAspect: { value: 9 / 16 },
      frameAspect: { value: 6.18 / 6.02 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float mediaAspect;
      uniform float frameAspect;
      varying vec2 vUv;
      void main() {
        vec2 cropped = vUv;
        if (mediaAspect < frameAspect) {
          cropped.y = (cropped.y - 0.5) * (mediaAspect / frameAspect) + 0.5;
        } else {
          cropped.x = (cropped.x - 0.5) * (frameAspect / mediaAspect) + 0.5;
        }
        vec3 color = texture2D(map, cropped).rgb;
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float vignette = mix(0.76, 1.0, smoothstep(0.0, 0.09, edge));
        float scanline = 0.975 + 0.025 * sin(vUv.y * 1300.0);
        gl_FragColor = vec4(color * vignette * scanline, 1.0);
      }
    `,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
}

function makePedestal(radius: number) {
  const pedestal = new THREE.Group();
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius + 0.24, 0.42, 72),
    new THREE.MeshPhysicalMaterial({
      color: 0xe3c8dc,
      roughness: 0.42,
      clearcoat: 0.18,
      clearcoatRoughness: 0.46,
    }),
  );
  platform.receiveShadow = true;
  pedestal.add(platform);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.03, 0.065, 12, 96),
    new THREE.MeshStandardMaterial({
      color: 0xffd79d,
      roughness: 0.44,
      metalness: 0.2,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.23;
  pedestal.add(ring);
  return pedestal;
}

function makeDirtPath(seed: number) {
  const group = new THREE.Group();
  const length = 32 + (seed % 3) * 4;
  const steps = 12;
  const shape = new THREE.Shape();
  const leftEdge: THREE.Vector2[] = [];
  const rightEdge: THREE.Vector2[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const along = -length / 2 + (index / steps) * length;
    const bend = Math.sin(seed * 1.73 + index * 0.82) * 0.42;
    const halfWidth = 1.65 + Math.sin(seed * 0.61 + index * 1.37) * 0.24;
    leftEdge.push(new THREE.Vector2(bend - halfWidth, along));
    rightEdge.push(new THREE.Vector2(bend + halfWidth, along));
  }
  shape.moveTo(leftEdge[0].x, leftEdge[0].y);
  leftEdge.slice(1).forEach((point) => shape.lineTo(point.x, point.y));
  rightEdge.reverse().forEach((point) => shape.lineTo(point.x, point.y));
  shape.closePath();

  const path = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 5),
    new THREE.MeshStandardMaterial({
      color: seed % 2 === 0 ? 0x9d7353 : 0xad805b,
      roughness: 0.98,
      metalness: 0,
    }),
  );
  path.rotation.x = -Math.PI / 2;
  path.receiveShadow = true;
  group.add(path);

  for (let index = 0; index < 11; index += 1) {
    const pebble = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.09 + ((seed + index) % 3) * 0.035, 1),
      new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? 0xc4a081 : 0x806650,
        roughness: 0.94,
      }),
    );
    pebble.position.set(
      Math.sin(seed * 2.1 + index * 1.9) * 1.25,
      0.05,
      -length / 2 + 1.4 + ((index * 7 + seed * 3) % Math.max(4, Math.floor(length - 3))),
    );
    pebble.scale.set(1.5, 0.45, 1);
    pebble.castShadow = true;
    group.add(pebble);
  }
  return group;
}

function makeRoundedPanelShape(width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function drawWrappedLine(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((value, index) => context.fillText(value, centerX, startY + index * lineHeight));
}

function drawChapterTexture(context: CanvasRenderingContext2D, copy: ChapterCopy) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(140, 90, width - 120, height - 70);
  gradient.addColorStop(0, "rgba(68, 52, 116, 0.96)");
  gradient.addColorStop(0.58, "rgba(103, 67, 132, 0.96)");
  gradient.addColorStop(1, "rgba(145, 76, 128, 0.96)");
  context.fillStyle = gradient;
  context.beginPath();
  context.roundRect(34, 34, width - 68, height - 68, 96);
  context.fill();
  context.strokeStyle = "rgba(255, 218, 172, 0.92)";
  context.lineWidth = 14;
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffd9a6";
  context.font = "800 58px system-ui, sans-serif";
  context.letterSpacing = "5px";
  context.fillText(copy.eyebrow, width / 2, 160);
  context.letterSpacing = "0px";

  const titleLines = copy.title.split("\n");
  const longestTitle = Math.max(...titleLines.map((line) => line.length));
  const titleSize = longestTitle > 14 ? 142 : longestTitle > 9 ? 176 : 214;
  const titleLineHeight = titleSize * 1.14;
  const titleStart = titleLines.length > 1 ? 365 : 475;
  context.fillStyle = "#fff8ea";
  context.font = `900 ${titleSize}px system-ui, sans-serif`;
  titleLines.forEach((line, index) => {
    context.fillText(line, width / 2, titleStart + index * titleLineHeight);
  });

  context.fillStyle = "rgba(255, 248, 234, 0.9)";
  context.font = "700 48px system-ui, sans-serif";
  drawWrappedLine(context, copy.note, width / 2, 875, width - 340, 62);
}

function buildScene(host: HTMLDivElement, shorts: BirthdayShort[], yearStats: BirthdayYearStats): SceneRuntime {
  const profile = getRenderProfile(window.innerWidth, window.devicePixelRatio);
  const isCompact = profile.compact;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(profile.pixelRatio);
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
  scene.environment = environmentTexture;
  const roomColor = new THREE.Color(0x6f609f);
  scene.background = roomColor;
  scene.fog = new THREE.Fog(0x7163a3, 30, 150);

  const camera = new THREE.PerspectiveCamera(
    isCompact ? 64 : 56,
    host.clientWidth / Math.max(1, host.clientHeight),
    0.1,
    isCompact ? 150 : 190,
  );
  camera.position.set(0, 0.25, 7);

  scene.add(new THREE.HemisphereLight(0xfff4e5, 0x4c416b, 1.75));
  const keyLight = new THREE.DirectionalLight(0xffe8cf, 2.8);
  keyLight.position.set(-4.5, 9, 5.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(isCompact ? 1024 : 2048, isCompact ? 1024 : 2048);
  keyLight.shadow.camera.left = -13;
  keyLight.shadow.camera.right = 13;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -9;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 48;
  keyLight.shadow.bias = -0.00035;
  scene.add(keyLight);
  const warmLight = new THREE.PointLight(0xffd2a3, 11, 52, 2);
  warmLight.position.set(-4.5, 3.6, -18);
  scene.add(warmLight);
  const pinkLight = new THREE.PointLight(0xf1a4bb, 7, 48, 2);
  pinkLight.position.set(5.2, 0.4, -34);
  scene.add(pinkLight);
  const blueLight = new THREE.PointLight(0xa9c6e8, 6, 54, 2);
  blueLight.position.set(-5.8, -1.4, -58);
  scene.add(blueLight);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x7566a8,
    roughness: 0.62,
    metalness: 0.02,
  });
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x68598f,
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.14,
    clearcoatRoughness: 0.5,
  });
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x8173b4,
    roughness: 0.68,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.36, ROOM_DEPTH), floorMaterial);
  floor.position.set(0, -5.28, -ROOM_DEPTH / 2);
  floor.receiveShadow = true;
  scene.add(floor);
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.36, ROOM_DEPTH), ceilingMaterial);
  ceiling.position.set(0, 6.12, -ROOM_DEPTH / 2);
  scene.add(ceiling);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.72, 11.5, ROOM_DEPTH), wallMaterial);
  leftWall.position.set(-8.52, 0.42, -ROOM_DEPTH / 2);
  scene.add(leftWall);
  const rightWall = leftWall.clone();
  rightWall.position.x = 8.52;
  scene.add(rightWall);
  const wallRibs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.18, 10.7, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0xd5c6e6,
      roughness: 0.48,
      metalness: 0.04,
    }),
    profile.frameCount * 2,
  );
  wallRibs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(wallRibs);

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8a2d6,
    roughness: 0.38,
    metalness: 0.12,
  });
  const wallFrameCount = profile.frameCount * 2;
  const wallFramePieces = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    trimMaterial,
    wallFrameCount * 4,
  );
  wallFramePieces.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(wallFramePieces);
  const wallFrameInsets = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.16, 6.45, 6.2),
    new THREE.MeshStandardMaterial({
      color: 0x3f345e,
      roughness: 0.42,
      metalness: 0.04,
    }),
    wallFrameCount,
  );
  wallFrameInsets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(wallFrameInsets);

  const videoChannels = shorts.map((short) => {
    const video = document.createElement("video");
    video.src = short.videoUrl;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const material = createCrtMaterial(texture);
    video.addEventListener("loadedmetadata", () => {
      const aspect = video.videoWidth / Math.max(1, video.videoHeight);
      material.uniforms.mediaAspect.value = aspect;
    });
    return { video, texture, material, playing: false, wanted: false };
  });
  const wallVideoScreens = Array.from(
    { length: Math.min(profile.frameCount, 25) },
    (_, screenIndex) => [-1, 1].map((side, sideIndex) => {
      const channelIndex = (screenIndex * 2 + sideIndex) % Math.max(1, videoChannels.length);
      const channel = videoChannels[channelIndex];
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.18, 6.02), channel.material);
      mesh.position.set(side * 7.91, 0.3, -30 - screenIndex * 24);
      mesh.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      mesh.renderOrder = 0;
      scene.add(mesh);
      return { mesh, screenIndex, channelIndex };
    }),
  ).flatMap((screens) => screens);

  const chapterCanvas = document.createElement("canvas");
  chapterCanvas.width = 2048;
  chapterCanvas.height = 1024;
  const chapterContext = chapterCanvas.getContext("2d");
  if (!chapterContext) throw new Error("3B başlık panosu hazırlanamadı");
  const chapterTexture = new THREE.CanvasTexture(chapterCanvas);
  chapterTexture.colorSpace = THREE.SRGBColorSpace;
  chapterTexture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const chapterMaterial = new THREE.MeshBasicMaterial({
    map: chapterTexture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  const chapterBillboard = new THREE.Group();
  const chapterBackMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a376f,
    roughness: 0.48,
    metalness: 0.04,
    transparent: true,
  });
  const chapterBack = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeRoundedPanelShape(12.65, 6.2, 0.56), {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.08,
      bevelThickness: 0.07,
    }),
    chapterBackMaterial,
  );
  chapterBack.position.z = -0.13;
  chapterBack.castShadow = true;
  chapterBillboard.add(chapterBack);
  const chapterFace = new THREE.Mesh(new THREE.PlaneGeometry(12.45, 6.05), chapterMaterial);
  chapterFace.position.z = 0.12;
  chapterBillboard.add(chapterFace);
  chapterBillboard.position.set(0, 0.4, -8);
  chapterBillboard.scale.setScalar(isCompact ? 0.66 : 1);
  scene.add(chapterBillboard);
  let renderedChapterKey = "";

  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8.15, 4.2, 0),
    new THREE.Vector3(-5.3, 6.08, 0),
    new THREE.Vector3(0, 6.72, 0),
    new THREE.Vector3(5.3, 6.08, 0),
    new THREE.Vector3(8.15, 4.2, 0),
  ]);
  const archGeometry = new THREE.TubeGeometry(archCurve, 36, 0.105, 7, false);
  const archMaterial = new THREE.MeshStandardMaterial({ color: 0xffd2a3, roughness: 0.46 });
  const arches = new THREE.InstancedMesh(archGeometry, archMaterial, profile.frameCount);
  arches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(arches);

  const crossLineGeometry = new THREE.BoxGeometry(16.5, 0.035, 0.055);
  const tileMaterial = new THREE.MeshBasicMaterial({ color: 0xcaa7d7, transparent: true, opacity: 0.72 });
  const floorCrossLines = new THREE.InstancedMesh(crossLineGeometry, tileMaterial, profile.frameCount);
  floorCrossLines.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(floorCrossLines);
  for (const x of [-6.1, -3.05, 0, 3.05, 6.1]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, ROOM_DEPTH), tileMaterial);
    line.position.set(x, -5.08, -ROOM_DEPTH / 2);
    scene.add(line);
  }

  const lightGeometry = new THREE.SphereGeometry(0.16, 12, 8);
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffe8c9, roughness: 0.42 });
  const ceilingLights = new THREE.InstancedMesh(lightGeometry, lightMaterial, profile.frameCount);
  ceilingLights.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(ceilingLights);

  const createModelStage = (radius: number) => {
    const stage = new THREE.Group();
    const pedestal = makePedestal(radius);
    pedestal.position.y = -2.5;
    stage.add(pedestal);
    stage.visible = false;
    scene.add(stage);
    return stage;
  };
  const gameBoyStage = createModelStage(2.3);
  const switchStage = createModelStage(3.15);

  let disposed = false;
  let resolveAssets!: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveAssets = resolve;
  });
  const loadingManager = new THREE.LoadingManager(resolveAssets);
  const loader = new GLTFLoader(loadingManager);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const maxAnisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const placeModel = (
    parent: THREE.Group,
    source: THREE.Object3D,
    position: THREE.Vector3,
    rotation = new THREE.Euler(),
    scale = 1,
  ) => {
    const anchor = new THREE.Group();
    anchor.position.copy(position);
    anchor.rotation.copy(rotation);
    anchor.scale.setScalar(scale);
    anchor.add(source);
    parent.add(anchor);
    return anchor;
  };
  const corridorNature = new THREE.Group();
  const travellingNature: Array<{
    anchor: THREE.Group;
    baseY: number;
    baseZ: number;
    bob: number;
    wrapBuffer: number;
  }> = [];
  scene.add(corridorNature);
  const placeTrackModel = (
    source: THREE.Object3D,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: number,
    bob = 0,
    wrapBuffer = 0,
  ) => {
    const anchor = placeModel(corridorNature, source, position, rotation, scale);
    travellingNature.push({ anchor, baseY: position.y, baseZ: position.z, bob, wrapBuffer });
    return anchor;
  };
  const dirtPathSegments: THREE.Group[] = [];
  for (let index = 0; index < 11; index += 1) {
    const path = placeTrackModel(
      makeDirtPath(index),
      new THREE.Vector3(0, -5.045, -64 - index * 54),
      new THREE.Euler(),
      1,
      0,
      24,
    );
    dirtPathSegments.push(path);
  }

  loader.load("/dgko/models/gameboy-optimized.glb", (gltf) => {
    if (disposed) return;
    const gameBoyFacing = gltf.scene;
    normalizeModel(gameBoyFacing, 3.7, maxAnisotropy);
    gameBoyFacing.rotation.y = 0;
    gameBoyStage.add(gameBoyFacing);
  });
  loader.load("/dgko/models/switch-oled-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 5.6, maxAnisotropy);
    gltf.scene.rotation.y = 0;
    switchStage.add(gltf.scene);
  });

  const finalStage = new THREE.Group();
  finalStage.visible = false;
  const grassIsland = new THREE.Mesh(
    new THREE.CircleGeometry(7.4, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0x79ad58,
      roughness: 0.74,
      clearcoat: 0.08,
    }),
  );
  grassIsland.rotation.x = -Math.PI / 2;
  grassIsland.position.set(0, -5.035, -7.7);
  grassIsland.receiveShadow = true;
  finalStage.add(grassIsland);

  const cakePedestal = makePedestal(3.25);
  cakePedestal.position.set(0, -4.78, -7.45);
  finalStage.add(cakePedestal);
  let cakeAnchor: THREE.Group | null = null;

  loader.load("/dgko/models/candy-cake-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 6.1, maxAnisotropy);
    cakeAnchor = placeModel(
      finalStage,
      gltf.scene,
      new THREE.Vector3(0, -1.72, -7.45),
      new THREE.Euler(0, -0.12, 0),
    );
  });
  loader.load("/dgko/models/question-block-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 2.5, maxAnisotropy);
    placeModel(
      finalStage,
      gltf.scene,
      new THREE.Vector3(5.15, -3.62, -8.2),
      new THREE.Euler(0, -0.35, 0),
    );
  });
  loader.load("/dgko/models/super-mushroom-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 2.45, maxAnisotropy);
    placeModel(
      finalStage,
      gltf.scene,
      new THREE.Vector3(3.75, getGroundedModelY(gltf.scene, -5.03), -4.85),
      new THREE.Euler(0, -0.3, 0),
    );
    placeModel(
      finalStage,
      gltf.scene.clone(true),
      new THREE.Vector3(-5.35, getGroundedModelY(gltf.scene, -5.03, 0.78), -6.25),
      new THREE.Euler(0, 0.38, 0),
      0.78,
    );
    for (let index = 0; index < 22; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const spread = 5.65 + ((index * 17) % 8) * 0.17;
      const mushroomScale = 0.42 + (index % 3) * 0.08;
      placeTrackModel(
        gltf.scene.clone(true),
        new THREE.Vector3(
          side * spread,
          getGroundedModelY(gltf.scene, -5.04, mushroomScale),
          -24 - index * 27 - ((index * 13) % 11),
        ),
        new THREE.Euler(0, side * (0.18 + (index % 4) * 0.12), 0),
        mushroomScale,
      );
    }
  });
  loader.load("/dgko/models/stylised-gifts-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 2.7, maxAnisotropy);
    placeModel(
      finalStage,
      gltf.scene,
      new THREE.Vector3(-3.72, -3.82, -7.05),
      new THREE.Euler(0, 0.28, 0),
    );
    placeModel(
      finalStage,
      gltf.scene.clone(true),
      new THREE.Vector3(-1.95, -4.13, -4.92),
      new THREE.Euler(0, -0.22, 0),
      0.72,
    );
    placeModel(
      finalStage,
      gltf.scene.clone(true),
      new THREE.Vector3(6.15, -4.08, -5.35),
      new THREE.Euler(0, -0.18, 0),
      0.76,
    );
  });
  loader.load("/dgko/models/stylized-clouds-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 13.5, maxAnisotropy);
    placeModel(
      finalStage,
      gltf.scene,
      new THREE.Vector3(0, 3.65, -14.8),
      new THREE.Euler(0, -0.18, 0),
    );
    for (let index = 0; index < 11; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      placeTrackModel(
        gltf.scene.clone(true),
        new THREE.Vector3(side * (1.8 + ((index * 11) % 7) * 0.42), 3.65 + (index % 3) * 0.48, -48 - index * 54),
        new THREE.Euler(0, side * (0.08 + (index % 4) * 0.09), 0),
        0.32 + (index % 3) * 0.06,
        0.08,
      );
    }
  });
  loader.load("/dgko/models/stylized-bush-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 3.35, maxAnisotropy);
    placeModel(
      finalStage,
      gltf.scene,
      new THREE.Vector3(-6.35, -3.3, -10.5),
      new THREE.Euler(0, 0.2, 0),
      1.08,
    );
    placeModel(
      finalStage,
      gltf.scene.clone(true),
      new THREE.Vector3(6.25, -3.3, -11.2),
      new THREE.Euler(0, -0.35, 0),
      1.04,
    );
    placeModel(
      finalStage,
      gltf.scene.clone(true),
      new THREE.Vector3(-6.4, -3.82, -3.9),
      new THREE.Euler(0, 0.55, 0),
      0.72,
    );
    for (let index = 0; index < 20; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      placeTrackModel(
        gltf.scene.clone(true),
        new THREE.Vector3(side * (6.05 + (index % 4) * 0.28), -4.1, -20 - index * 30),
        new THREE.Euler(0, side * (0.18 + (index % 5) * 0.17), 0),
        0.42 + (index % 3) * 0.08,
      );
    }
  });
  loader.load("/dgko/models/grass-patches-hq.glb", (gltf) => {
    if (disposed) return;
    normalizeModel(gltf.scene, 3.25, maxAnisotropy);
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.multiply(new THREE.Color(0x5f9f4a));
          material.needsUpdate = true;
        }
      });
    });
    for (let index = 0; index < 52; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      placeTrackModel(
        gltf.scene.clone(true),
        new THREE.Vector3(side * (5.25 + ((index * 7) % 9) * 0.2), -4.78, -14 - index * 11.5),
        new THREE.Euler(0, (index * 0.73) % Math.PI, 0),
        0.58 + (index % 4) * 0.08,
      );
    }
  });
  scene.add(finalStage);

  const dummy = new THREE.Object3D();
  const render = (
    elapsed: number,
    progress: number,
    travel: number,
    chapter: string,
    virtualSeconds: number,
  ) => {
    for (let index = 0; index < profile.frameCount; index += 1) {
      const z = wrapDepth(-18 - index * 18 + travel);
      dummy.position.set(0, 0, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      arches.setMatrixAt(index, dummy.matrix);

      dummy.position.set(0, -5.08, wrapDepth(-14 - index * 14 + travel));
      dummy.updateMatrix();
      floorCrossLines.setMatrixAt(index, dummy.matrix);

      dummy.position.set(index % 2 === 0 ? -4.4 : 4.4, 5.78, z - 1.6);
      dummy.scale.setScalar(index % 3 === 0 ? 1.35 : 1);
      dummy.updateMatrix();
      ceilingLights.setMatrixAt(index, dummy.matrix);

      const ribZ = wrapDepth(-14 - index * 14 + travel);
      for (const side of [-1, 1]) {
        dummy.position.set(side * 8.12, 0.42, ribZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        wallRibs.setMatrixAt(index * 2 + (side === -1 ? 0 : 1), dummy.matrix);
      }
    }
    arches.instanceMatrix.needsUpdate = true;
    floorCrossLines.instanceMatrix.needsUpdate = true;
    ceilingLights.instanceMatrix.needsUpdate = true;
    wallRibs.instanceMatrix.needsUpdate = true;

    for (let frameIndex = 0; frameIndex < wallFrameCount; frameIndex += 1) {
      const side = frameIndex % 2 === 0 ? -1 : 1;
      const segment = Math.floor(frameIndex / 2);
      const frameZ = wrapDepth(-30 - segment * 24 + travel);
      dummy.position.set(side * 8.04, 0.3, frameZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      wallFrameInsets.setMatrixAt(frameIndex, dummy.matrix);

      for (let piece = 0; piece < 4; piece += 1) {
        const index = frameIndex * 4 + piece;
        if (piece < 2) {
          dummy.position.set(side * 7.93, piece === 0 ? 3.66 : -3.06, frameZ);
          dummy.scale.set(0.32, 0.22, 6.85);
        } else {
          dummy.position.set(side * 7.93, 0.3, frameZ + (piece === 2 ? -3.34 : 3.34));
          dummy.scale.set(0.32, 6.95, 0.22);
        }
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        wallFramePieces.setMatrixAt(index, dummy.matrix);
      }
    }
    wallFrameInsets.instanceMatrix.needsUpdate = true;
    wallFramePieces.instanceMatrix.needsUpdate = true;

    videoChannels.forEach((channel) => {
      channel.wanted = false;
    });
    wallVideoScreens.forEach(({ mesh, screenIndex, channelIndex }) => {
      const z = getTunnelPanelDepth(screenIndex, travel, 24);
      mesh.position.z = z;
      mesh.visible = z < 10.5 && z > -155;
      if (z < 9 && z > -72) videoChannels[channelIndex].wanted = true;
    });
    videoChannels.forEach((channel) => {
      if (channel.wanted && !channel.playing) {
        channel.playing = true;
        channel.video.play().catch(() => {
          channel.playing = false;
        });
      } else if (!channel.wanted && channel.playing) {
        channel.video.pause();
        channel.playing = false;
      }
    });

    const copy = getChapterCopy(virtualSeconds, yearStats);
    if (copy.key !== renderedChapterKey) {
      drawChapterTexture(chapterContext, copy);
      chapterTexture.needsUpdate = true;
      renderedChapterKey = copy.key;
    }
    const copyProgress = Math.min(1, Math.max(0, (virtualSeconds - copy.start) / (copy.end - copy.start)));
    const entry = smoothstep(copyProgress * 6);
    const exit = copy.key === "finale" ? 1 : smoothstep((1 - copyProgress) * 7);
    const copyOpacity = entry * exit;
    chapterBillboard.visible = copyOpacity > 0.01;
    chapterMaterial.opacity = copyOpacity;
    chapterBackMaterial.opacity = copyOpacity;
    chapterBillboard.position.y = copy.key === "finale" ? 2.6 : 0.4;
    chapterBillboard.position.z = -11.5 + entry * 4.2;
    chapterBillboard.rotation.y = (1 - entry) * -0.11 + Math.sin(elapsed * 0.22) * 0.006;
    chapterBillboard.rotation.x = (1 - entry) * 0.045;
    const billboardScale = (isCompact ? 0.66 : 1) * (0.86 + entry * 0.14);
    chapterBillboard.scale.setScalar(billboardScale);

    travellingNature.forEach(({ anchor, baseY, baseZ, bob, wrapBuffer }, index) => {
      anchor.position.z = wrapDepthWithBuffer(baseZ + travel, wrapBuffer);
      anchor.position.y = baseY + Math.sin(elapsed * 0.32 + index * 0.91) * bob;
    });

    const placeTravellingStage = (
      stage: THREE.Group,
      baseZ: number,
      side: number,
      baseRotation: number,
    ) => {
      const z = wrapDepth(baseZ + travel);
      stage.visible = z < 8.5;
      stage.position.set(side * 4.3, -2.52, z);
      stage.rotation.y = baseRotation + Math.sin(elapsed * 0.28) * 0.009;
      stage.scale.setScalar(1);
    };
    placeTravellingStage(gameBoyStage, -176, -1, 0.06);
    placeTravellingStage(switchStage, -322, 1, -0.04);

    finalStage.visible = true;
    finalStage.position.z = -520 + travel;
    finalStage.scale.setScalar(1);
    if (cakeAnchor) cakeAnchor.position.y = -1.72 + Math.sin(elapsed * 0.8) * 0.018;

    const finale = chapter === "finale" ? smoothstep((progress - 0.8) / 0.14) : 0;
    const background = roomColor.clone().lerp(new THREE.Color(0x8b73b6), finale);
    scene.background = background;
    scene.fog!.color.copy(background);

    camera.position.x = Math.sin(elapsed * 0.19) * 0.055;
    camera.position.y = 0.25 + Math.cos(elapsed * 0.17) * 0.04;
    camera.rotation.z = Math.sin(elapsed * 0.11) * 0.002;
    warmLight.intensity = 10.5 + Math.sin(elapsed * 0.7) * 0.5;
    pinkLight.intensity = 6.5 + Math.cos(elapsed * 0.53) * 0.4;
    renderer.render(scene, camera);
  };

  const resize = () => {
    const width = host.clientWidth;
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const resizedProfile = getRenderProfile(width, window.devicePixelRatio);
    renderer.setPixelRatio(resizedProfile.pixelRatio);
    renderer.setSize(width, height);
  };

  const dispose = () => {
    disposed = true;
    videoChannels.forEach(({ video, texture }) => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
    });
    chapterTexture.dispose();
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.InstancedMesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    environmentTexture.dispose();
    pmremGenerator.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { ready, render, resize, dispose };
}

export function BirthdayExperience({ shorts, yearStats }: Props) {
  const sceneHost = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const [runId, setRunId] = useState(0);
  const [ready, setReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "working" | "done">("idle");
  const [recapOpen, setRecapOpen] = useState(false);
  const [selectedRecapKeys, setSelectedRecapKeys] = useState<RecapKey[]>(DEFAULT_RECAP_KEYS);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [uiFrame, setUiFrame] = useState(() => getFilmFrame(0, false));

  useEffect(() => {
    document.body.classList.add("dgko-active");
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    return () => document.body.classList.remove("dgko-active");
  }, []);

  useEffect(() => {
    const host = sceneHost.current;
    if (!host) return;
    let runtime: SceneRuntime | null = null;
    let animationFrame = 0;
    let lastUiUpdate = 0;
    let assetTimeout = 0;
    let filmStarted = false;
    let cancelled = false;

    setReady(false);
    setSceneFailed(false);
    setUiFrame(getFilmFrame(0, reducedMotion));

    function tick(now: number) {
      const elapsed = (now - startedAt.current) / 1000;
      const frame = getFilmFrame(elapsed, reducedMotion);
      runtime?.render(elapsed, frame.progress, frame.travel, frame.chapter.id, frame.virtualSeconds);
      if (now - lastUiUpdate > 34 || frame.finished) {
        setUiFrame(frame);
        lastUiUpdate = now;
      }
      if (!frame.finished) animationFrame = requestAnimationFrame(tick);
      else runtime?.render(elapsed, 1, frame.travel, "finale", frame.virtualSeconds);
    }

    function beginFilm() {
      if (cancelled || filmStarted) return;
      filmStarted = true;
      window.clearTimeout(assetTimeout);
      startedAt.current = performance.now();
      setReady(true);
      animationFrame = requestAnimationFrame(tick);
    }

    try {
      runtime = buildScene(host, shorts, yearStats);
      runtime.ready.then(beginFilm);
      assetTimeout = window.setTimeout(beginFilm, 9000);
    } catch {
      setSceneFailed(true);
      beginFilm();
    }

    const onResize = () => runtime?.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(assetTimeout);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrame);
      runtime?.dispose();
    };
  }, [runId, reducedMotion, shorts, yearStats]);

  const chapterCopy = getChapterCopy(uiFrame.virtualSeconds, yearStats);
  const finaleVisible = uiFrame.chapter.id === "finale";
  const confettiPieces = useMemo(
    () => Array.from({ length: 72 }, (_, index) => ({
      id: index,
      left: (index * 37 + 11) % 101,
      delay: -((index * 19) % 70) / 10,
      duration: 4.4 + (index % 8) * 0.36,
      drift: ((index * 29) % 90) - 45,
      rotation: (index * 53) % 360,
    })),
    [],
  );
  const recapItems = useMemo(() => getRecapItems(yearStats), [yearStats]);
  const toggleRecapKey = (key: RecapKey) => {
    setSelectedRecapKeys((current) => current.includes(key)
      ? current.filter((value) => value !== key)
      : [...current, key]);
  };
  const shareRecap = async () => {
    if (shareState === "working" || selectedRecapKeys.length === 0) return;
    setShareState("working");
    try {
      const file = await createShareImage(yearStats, selectedRecapKeys);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Selçuk Peköz · Son 365 Gün",
          text: "İyi ki doğdun Selçuk!",
        });
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setShareState("done");
      setRecapOpen(false);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "AbortError") setShareState("idle");
      else setShareState("idle");
    }
  };

  return (
    <main
      className="dgko-root"
      data-chapter={uiFrame.chapter.id}
      aria-label="Selçuk Peköz doğum günü filmi"
    >
      <div ref={sceneHost} className="dgko-scene" aria-hidden="true" />
      <div className="dgko-vignette" aria-hidden="true" />

      {!ready && (
        <div className="dgko-loader" role="status" aria-live="polite">
          <span aria-hidden="true" />
          <p>Hazırlanıyor…</p>
        </div>
      )}

      {sceneFailed && <div className="dgko-webgl-fallback" aria-hidden="true" />}

      <p className="dgko-sr-copy" aria-live="polite">
        {chapterCopy.eyebrow}. {chapterCopy.title.replace("\n", " ")}. {chapterCopy.note}
      </p>

      <div className={`dgko-confetti ${finaleVisible ? "is-visible" : ""}`} aria-hidden="true">
        {confettiPieces.map((piece) => (
          <i
            key={piece.id}
            className={`tone-${piece.id % 6}`}
            style={{
              "--x": `${piece.left}vw`,
              "--delay": `${piece.delay}s`,
              "--duration": `${piece.duration}s`,
              "--drift": `${piece.drift}px`,
              "--rotation": `${piece.rotation}deg`,
            } as CSSProperties}
          />
        ))}
      </div>

      {uiFrame.finished && recapOpen && (
        <section className="dgko-recap-picker" aria-label="Paylaşılacak yıllık özet">
          <header>
            <div>
              <p>PAYLAŞIM ÖZETİ</p>
              <h2>Neleri göstermek istersin?</h2>
            </div>
            <button type="button" aria-label="Özeti kapat" onClick={() => setRecapOpen(false)}>×</button>
          </header>
          <div className="dgko-recap-grid">
            {recapItems.map((item) => {
              const selected = selectedRecapKeys.includes(item.key);
              return (
                <button
                  type="button"
                  key={item.key}
                  className={selected ? "is-selected" : ""}
                  aria-pressed={selected}
                  onClick={() => toggleRecapKey(item.key)}
                >
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <footer>
            <button
              type="button"
              className="dgko-recap-all"
              onClick={() => setSelectedRecapKeys(
                selectedRecapKeys.length === DEFAULT_RECAP_KEYS.length ? [] : DEFAULT_RECAP_KEYS,
              )}
            >
              {selectedRecapKeys.length === DEFAULT_RECAP_KEYS.length ? "Tümünü kaldır" : "Tümünü seç"}
            </button>
            <button
              type="button"
              className="dgko-recap-share"
              disabled={selectedRecapKeys.length === 0 || shareState === "working"}
              onClick={shareRecap}
            >
              {shareState === "working" ? "Hazırlanıyor…" : `${selectedRecapKeys.length} istatistiği paylaş`}
            </button>
          </footer>
        </section>
      )}

      {finaleVisible && (
        <details className="dgko-credits">
          <summary aria-label="3B model kaynakları">ⓘ</summary>
          <div>
            <a href="https://sketchfab.com/3d-models/ad2f6be906e948f793fe722bbae5d29c">
              Game Boy · lokeig
            </a>
            <a href="https://sketchfab.com/3d-models/nintendo-switch-oled-model-9b8721e10a4f4a689fc4f72cdcee4b01">
              Nintendo Switch OLED · rtql8d
            </a>
            <a href="https://sketchfab.com/3d-models/mario-question-block-efac007aa9214bcaaa5bcb2cf23aeb47">
              Mario Question Block · PatelDev
            </a>
            <a href="https://sketchfab.com/3d-models/mario-super-mushroom-bfecb0aee2984ddca543ea90dcb270cc">
              Super Mushroom · smarthug
            </a>
            <a href="https://sketchfab.com/3d-models/a-gift-box-1a53662e300b4d7e9ae39eba101409ea">
              Gift Box · Rofnay
            </a>
            <a href="https://sketchfab.com/3d-models/stylized-clouds-e326c36890364526910cba03c1393ebc">
              Stylized Clouds · lavakongen
            </a>
            <a href="https://sketchfab.com/3d-models/candy-covered-cake-draft-170683a4e5c54b0e9e202064fb53f52a">
              Candy-covered Cake · Rixael
            </a>
            <a href="https://sketchfab.com/3d-models/small-stylised-bush-a83fd7049a784ca6bc0095e7323451d0">
              Stylised Bush · Parelaxel
            </a>
            <a href="https://sketchfab.com/3d-models/grass-patches-6952780b80594a31aab2dedf7249a47a">
              Grass Patches · DJMaesen
            </a>
            <span>CC BY / Game Boy: CC BY-NC · modeller web için optimize edildi</span>
          </div>
        </details>
      )}

      {uiFrame.finished && (
        <div className="dgko-finale-actions">
          <button type="button" className="dgko-share" onClick={() => setRecapOpen(true)}>
            <span aria-hidden="true">↗</span>
            {shareState === "done" ? "Tekrar paylaş" : "Özeti paylaş"}
          </button>
          <button
            type="button"
            className="dgko-replay"
            onClick={() => {
              setRecapOpen(false);
              setRunId((value) => value + 1);
            }}
          >
            <span aria-hidden="true">↻</span> Yeniden oynat
          </button>
        </div>
      )}
    </main>
  );
}
