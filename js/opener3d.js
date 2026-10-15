/* Albright Innovations: the 3D opener on the homepage.
   What it does:
     1. Chaos: the clutter of a busy week (a phone full of missed calls, sticky notes, an overdue
        invoice, a mug, keys...) floats and tumbles around a chrome "Busy." for a few seconds.
     2. Tidy-up: everything swings upright and glides into a neat, squared-up flat-lay in the
        "Everything in its place" area, and the windows with the real headline fade in.
     3. Afterwards it sits still, with a small tilt toward the pointer. "Show me the mess" replays it.
   Scrolling, clicking or pressing a key during the chaos tidies it right away.
   With reduced motion turned on, or if this file loads late, it goes straight to the tidy flat-lay.
   If 3D can't run at all, the page shows the windows without the flat-lay (see css/site.css).
   Colors come from the site's color tokens, so dark mode works. Made with three.js (threejs.org). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const section = document.querySelector('[data-op]');
const root = document.documentElement;
const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHAOS_MS = 3200, TIDY_MS = 1700, UNTIDY_MS = 1100;

if (section) {
  start().catch(function () { giveUp(); });
}

/* Something failed: show the page without the 3D flat-lay. */
function giveUp() {
  root.classList.remove('op-js');
  section.classList.remove('op-3d', 'is-chaos');
  section.classList.add('is-tidy');
}

async function start() {
  const canvas = section.querySelector('.op-stage');
  const knollEl = section.querySelector('.op-knoll');
  const replayBtn = section.querySelector('[data-op-replay]');

  /* ---------- colors from the site's tokens ---------- */
  const css = getComputedStyle(root);
  const token = function (name, fallback) { return (css.getPropertyValue(name) || '').trim() || fallback; };
  const P = {
    paper: token('--inv-ink', '#F3F0E8'),   /* the clay and paper color, light in both themes */
    ink: token('--inv-bg', '#15171C'),      /* printed text, dark in both themes */
    accent: token('--accent', '#2F4BD8')
  };
  const dark = token('--bg', '#FFFFFF').toUpperCase() !== '#FFFFFF';

  /* ---------- the font for printed labels, and the chrome word ---------- */
  try { await Promise.all([document.fonts.load('600 40px Archivo'), document.fonts.load('400 24px Archivo'), document.fonts.load('700 60px Archivo')]); } catch (e) { /* labels fall back to a system font */ }
  const fontJson = await (await fetch('/js/opener-font.json')).json();
  const wordFont = new FontLoader().parse(fontJson);

  /* ---------- renderer, scene, camera, light ---------- */
  const phoneSize = section.clientWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phoneSize ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const CAM_Z = 18, FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(-4, 6, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(phoneSize ? 1024 : 2048, phoneSize ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 6;
  scene.add(sun);

  const shadowMax = dark ? 0.28 : 0.1;   /* shadows fade in as things settle onto the desk */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: shadowMax }));
  floor.position.z = -2.6;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- materials ---------- */
  const clay = new THREE.MeshStandardMaterial({ color: P.paper, roughness: 0.82, metalness: 0, envMapIntensity: 0.5 });
  const accent = new THREE.MeshStandardMaterial({ color: P.accent, roughness: 0.45, metalness: 0.05 });
  const inkMat = new THREE.MeshStandardMaterial({ color: P.ink, roughness: 0.4 });
  const chrome = new THREE.MeshStandardMaterial({ color: P.paper, roughness: 0.16, metalness: 1, envMapIntensity: 2.4 });
  /* the word: polished and pearly rather than dark metal, so it reads light like the clay */
  const pearl = new THREE.MeshPhysicalMaterial({ color: P.paper, roughness: 0.18, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 2.2 });

  /* ---------- printed labels, drawn on a canvas and wrapped onto the objects ---------- */
  function tex(w, h, draw) {
    const c = document.createElement('canvas'), s = 3;
    c.width = w * s; c.height = h * s;
    const g = c.getContext('2d');
    g.scale(s, s);
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function font(g, weight, size) { g.font = weight + ' ' + size + 'px Archivo, "Helvetica Neue", Arial, sans-serif'; }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function paperBg(g, w, h) { g.fillStyle = P.paper; g.fillRect(0, 0, w, h); }
  function rule(g, x, y, w, alpha) { g.globalAlpha = alpha || 0.14; g.fillStyle = P.ink; g.fillRect(x, y, w, 2); g.globalAlpha = 1; }

  function face(w, h, texture, z) {
    /* a little glow from the print itself, so labels stay readable when they face away from the light */
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.32 }));
    m.position.z = z;
    return m;
  }
  function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m; }
  function sheet(w, h, d, draw, texW) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(w, h, d), clay));
    const tw = texW || 240;
    g.add(face(w, h, tex(tw, Math.round(tw * h / w), draw), d / 2 + 0.002));
    return g;
  }

  /* ---------- the objects: front faces +z, sized in rough real proportion ---------- */
  function phone() {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(1.1, 2.2, 0.14, 4, 0.13), clay));
    g.add(face(1.0, 2.06, tex(200, 412, function (c, w, h) {
      c.fillStyle = P.ink; rrect(c, 0, 0, w, h, 22); c.fill();
      c.fillStyle = P.paper; c.textAlign = 'center';
      font(c, 600, 12); c.fillText('9:14', w / 2, 24);
      c.fillStyle = P.accent; font(c, 700, 76); c.fillText('3', w / 2, 140);
      c.fillStyle = P.paper; font(c, 600, 20); c.fillText('missed calls', w / 2, 172);
      [['Unknown caller', '8:52 AM'], ['(555) 555-0198', '11:30 AM'], ['Mike, roof job', '2:14 PM']].forEach(function (r, i) {
        const y = 214 + i * 56;
        c.globalAlpha = 0.12; c.fillStyle = P.paper; rrect(c, 14, y, w - 28, 44, 10); c.fill(); c.globalAlpha = 1;
        c.fillStyle = P.accent; c.beginPath(); c.arc(30, y + 22, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = P.paper; c.textAlign = 'left'; font(c, 600, 12); c.fillText(r[0], 44, y + 20);
        c.globalAlpha = 0.6; font(c, 400, 11); c.fillText('Missed call · ' + r[1], 44, y + 35); c.globalAlpha = 1;
      });
    }), 0.071));
    return g;
  }
  function sticky(lines, underline) {
    return sheet(1.25, 1.25, 0.025, function (c, w, h) {
      paperBg(c, w, h);
      c.globalAlpha = 0.22; c.fillStyle = P.accent; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
      c.globalAlpha = 0.12; c.fillStyle = P.accent; c.fillRect(0, 0, w, 26); c.globalAlpha = 1;
      c.fillStyle = P.ink; font(c, 600, 27);
      lines.forEach(function (l, i) { c.fillText(l, 22, 92 + i * 38); });
      if (underline) { c.fillStyle = P.accent; c.fillRect(22, 92 + (lines.length - 1) * 38 + 10, 150, 4); }
    });
  }
  function invoice() {
    return sheet(1.5, 2.0, 0.02, function (c, w, h) {
      paperBg(c, w, h);
      c.fillStyle = P.ink; font(c, 700, 24); c.fillText('INVOICE', 22, 44);
      c.globalAlpha = 0.6; font(c, 400, 12); c.fillText('#1042 · Due Sept 30', 22, 64); c.globalAlpha = 1;
      for (let i = 0; i < 6; i++) { rule(c, 22, 96 + i * 26, w - 44); }
      c.fillStyle = P.ink; font(c, 600, 14); c.fillText('Total', 22, 270);
      c.textAlign = 'right'; c.fillText('$2,480.00', w - 22, 270);
      c.save(); c.translate(w / 2, 200); c.rotate(-0.3);
      c.strokeStyle = P.accent; c.lineWidth = 4; rrect(c, -86, -26, 172, 52, 6); c.stroke();
      c.fillStyle = P.accent; c.textAlign = 'center'; font(c, 700, 30); c.fillText('OVERDUE', 0, 11);
      c.restore();
    });
  }
  function calendar() {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(1.3, 1.5, 0.08, 3, 0.04), clay));
    g.add(face(1.3, 1.5, tex(260, 300, function (c, w, h) {
      paperBg(c, w, h);
      c.fillStyle = P.accent; c.fillRect(0, 0, w, 62);
      c.fillStyle = P.paper; c.textAlign = 'center'; font(c, 700, 22); c.fillText('OCTOBER', w / 2, 40);
      c.fillStyle = P.ink; font(c, 700, 110); c.fillText('14', w / 2, 190);
      c.globalAlpha = 0.65; font(c, 400, 16); c.fillText('3 jobs · 2 quotes · 1 inspection', w / 2, 250); c.globalAlpha = 1;
    }), 0.041));
    return g;
  }
  function receipt() {
    return sheet(0.7, 2.1, 0.01, function (c, w, h) {
      paperBg(c, w, h);
      c.fillStyle = P.ink; c.textAlign = 'center'; font(c, 700, 16); c.fillText('HARDWARE', w / 2, 36);
      c.textAlign = 'left'; font(c, 400, 12);
      [['Lumber', '112.40'], ['Screws', '18.95'], ['Paint', '54.10']].forEach(function (r, i) {
        c.fillText(r[0], 14, 84 + i * 30); c.textAlign = 'right'; c.fillText(r[1], w - 14, 84 + i * 30); c.textAlign = 'left';
      });
      rule(c, 14, 184, w - 28, 0.3);
      font(c, 700, 13); c.fillText('TOTAL', 14, 210); c.textAlign = 'right'; c.fillText('185.45', w - 14, 210);
      c.textAlign = 'center'; c.globalAlpha = 0.5; font(c, 400, 10); c.fillText('Thank you', w / 2, 300); c.globalAlpha = 1;
      for (let x = 0; x < w; x += 12) { c.fillStyle = P.ink; c.globalAlpha = 0.08; c.fillRect(x, h - 8, 6, 8); }
      c.globalAlpha = 1;
    }, 120);
  }
  function mug() {
    const g = new THREE.Group();
    const pts = [[0, -0.45], [0.4, -0.45], [0.42, -0.42], [0.42, 0.45], [0.38, 0.45], [0.38, -0.38], [0, -0.38]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    g.add(mesh(new THREE.LatheGeometry(pts, 40), clay));
    const band = mesh(new THREE.CylinderGeometry(0.424, 0.424, 0.14, 40, 1, true), accent);
    band.position.y = 0.08; g.add(band);
    const handle = mesh(new THREE.TorusGeometry(0.2, 0.055, 12, 28, Math.PI), clay);
    handle.rotation.z = -Math.PI / 2; handle.position.x = 0.42; g.add(handle);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.38, 40), inkMat);
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.36; g.add(coffee);
    return g;
  }
  function calculator() {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(1.0, 1.5, 0.16, 4, 0.08), clay));
    g.add(face(0.92, 1.42, tex(184, 284, function (c, w, h) {
      paperBg(c, w, h);
      c.fillStyle = P.ink; rrect(c, 14, 14, w - 28, 54, 8); c.fill();
      c.fillStyle = P.paper; c.textAlign = 'right'; font(c, 600, 26); c.fillText('1,248.50', w - 26, 52);
      for (let r = 0; r < 5; r++) {
        for (let k = 0; k < 4; k++) {
          const last = r === 4 && k === 3;
          c.fillStyle = last ? P.accent : P.ink; c.globalAlpha = last ? 1 : 0.14;
          c.beginPath(); c.arc(34 + k * 39, 100 + r * 38, 14, 0, Math.PI * 2); c.fill();
        }
      }
      c.globalAlpha = 1;
    }), 0.081));
    return g;
  }
  function clipboard() {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(1.35, 1.85, 0.05, 3, 0.02), accent));
    g.add(face(1.2, 1.6, tex(240, 320, function (c, w, h) {
      paperBg(c, w, h);
      c.fillStyle = P.ink; font(c, 700, 22); c.fillText('TO DO', 22, 58);
      ['Order parts', 'Call supplier back', 'Send 4 invoices', 'Schedule crew', 'Update website'].forEach(function (t, i) {
        const y = 100 + i * 42;
        c.globalAlpha = 0.5; c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(22, y - 15, 18, 18); c.globalAlpha = 1;
        c.fillStyle = P.ink; font(c, 400, 16); c.fillText(t, 52, y);
      });
    }), 0.03));
    const clip = mesh(new RoundedBoxGeometry(0.5, 0.2, 0.12, 3, 0.04), chrome);
    clip.position.set(0, 0.88, 0.07); g.add(clip);
    return g;
  }
  function keys() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.28, 0.035, 10, 40), chrome));
    function key(angle) {
      const k = new THREE.Group();
      const head = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 28), chrome);
      head.rotation.x = Math.PI / 2; head.position.y = -0.48; k.add(head);
      const blade = mesh(new THREE.BoxGeometry(0.1, 0.62, 0.04), chrome);
      blade.position.y = -0.92; k.add(blade);
      [0, 1, 2].forEach(function (i) { const tooth = mesh(new THREE.BoxGeometry(0.07, 0.06, 0.04), chrome); tooth.position.set(0.075, -0.8 - i * 0.13, 0); k.add(tooth); });
      k.rotation.z = angle;
      return k;
    }
    g.add(key(0.15)); g.add(key(-0.5));
    const tag = mesh(new RoundedBoxGeometry(0.32, 0.46, 0.03, 3, 0.012), accent);
    tag.position.set(0.32, 0.26, 0); tag.rotation.z = -0.5; g.add(tag);
    return g;
  }
  function envelope() {
    return sheet(1.7, 1.05, 0.03, function (c, w, h) {
      paperBg(c, w, h);
      c.globalAlpha = 0.2; c.strokeStyle = P.ink; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * 0.55); c.lineTo(w, 0); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = P.accent; c.fillRect(w - 52, 14, 36, 42);
      c.fillStyle = P.ink; c.textAlign = 'center'; font(c, 700, 15); c.fillText('FINAL NOTICE', w / 2, h - 24);
    });
  }
  function pencil() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.5, 6), accent));
    const wood = mesh(new THREE.ConeGeometry(0.075, 0.22, 6), clay);
    wood.position.y = 0.86; g.add(wood);
    const lead = mesh(new THREE.ConeGeometry(0.025, 0.07, 6), inkMat);
    lead.position.y = 0.995; g.add(lead);
    const band = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), chrome);
    band.position.y = -0.8; g.add(band);
    const eraser = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12), clay);
    eraser.position.y = -0.91; g.add(eraser);
    return g;
  }

  /* Which objects, in which order. Phones get the first eight. */
  const ALL = [
    { make: phone },
    { make: function () { return sticky(['Call back', 'Tues!'], true); } },
    { make: invoice },
    { make: mug, tidyRot: [Math.PI / 2, 0, 0] },
    { make: function () { return sticky(['Quote for the', 'Hendersons??']); } },
    { make: calculator },
    { make: keys },
    { make: pencil },
    { make: function () { return sticky(["Where's the", 'spreadsheet?']); } },
    { make: calendar },
    { make: clipboard },
    { make: receipt },
    { make: envelope },
    { make: function () { return sticky(['Post on', 'Facebook'], true); } }
  ];
  const chosen = phoneSize ? ALL.slice(0, 8) : ALL;

  /* deterministic "random", so the mess looks the same on every visit */
  let seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function range(a, b) { return a + (b - a) * rnd(); }

  const items = chosen.map(function (spec, i) {
    const obj = spec.make();
    const tidyRot = new THREE.Euler().fromArray(spec.tidyRot || [0, 0, 0]);
    obj.rotation.copy(tidyRot);
    obj.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    obj.rotation.set(0, 0, 0);
    scene.add(obj);
    return {
      obj: obj, i: i,
      tidyW: size.x, tidyH: size.y,
      tidyQ: new THREE.Quaternion().setFromEuler(tidyRot),
      chaosRot: new THREE.Euler(range(-1.2, 1.2), range(-1.2, 1.2), range(-Math.PI, Math.PI)),
      spin: new THREE.Vector3(range(-0.35, 0.35), range(-0.35, 0.35), range(-0.25, 0.25)),
      phase: range(0, Math.PI * 2), freq: range(0.35, 0.7),
      chaos: { pos: new THREE.Vector3(), scale: 1 },
      tidy: { pos: new THREE.Vector3(), scale: 1 },
      push: new THREE.Vector3(),
      delay: i * 0.035
    };
  });
  const maxDelay = (items.length - 1) * 0.035;

  /* the chrome word */
  const wordGeo = new TextGeometry('Busy.', { font: wordFont, size: 1, height: 0.28, depth: 0.28, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 4 });
  wordGeo.computeBoundingBox();
  wordGeo.center();
  const wordW = wordGeo.boundingBox.max.x - wordGeo.boundingBox.min.x;
  const word = new THREE.Mesh(wordGeo, pearl);   /* no shadow: it would leave a ghost word on the page */
  scene.add(word);
  const wordPose = { pos: new THREE.Vector3(), scale: 1 };

  /* ---------- page pixels to 3D positions, on the z = 0 plane ---------- */
  let W = 1, H = 1, upp = 0.01, halfW = 1, halfH = 1;
  function toWorld(x, y, out) { return out.set((x - W / 2) * upp, (H / 2 - y) * upp, 0); }

  function layout() {
    W = section.clientWidth; H = section.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    halfW = halfH * camera.aspect;
    upp = (2 * halfH) / H;
    const sc = sun.shadow.camera;
    sc.left = -halfW - 3; sc.right = halfW + 3; sc.top = halfH + 3; sc.bottom = -halfH - 3; sc.near = 1; sc.far = 60;
    sc.updateProjectionMatrix();

    /* the part of the opener on screen at the top of the page, where the mess happens */
    const top = Math.max(0, section.getBoundingClientRect().top + window.scrollY);
    const visH = Math.min(H, Math.max(320, window.innerHeight - top));
    const basePx = W < 760 ? 70 : 92;   /* about how big a 1-unit object looks */
    const tmp = new THREE.Vector3();

    seed = 11;
    items.forEach(function (it) {
      let x, y, tries = 0;
      do {
        x = range(0.06, 0.94) * W; y = range(0.08, 0.92) * visH; tries++;
      } while (tries < 12 && Math.abs(x - W / 2) < W * 0.2 && Math.abs(y - visH / 2) < visH * 0.16);
      toWorld(x, y, tmp);
      it.chaos.pos.set(tmp.x, tmp.y, range(-1.6, 1.8));
      it.chaos.scale = basePx * upp * range(0.9, 1.2);
    });
    toWorld(W / 2, visH / 2, wordPose.pos);
    wordPose.pos.z = 2.2;
    wordPose.scale = Math.min(W * 0.5, 560) * upp / wordW;

    /* the neat flat-lay: a grid inside the "Everything in its place" area */
    const r = knollEl.getBoundingClientRect(), s = section.getBoundingClientRect();
    const kx = r.left - s.left, ky = r.top - s.top, kw = r.width, kh = r.height;
    const rows = 2, cols = Math.ceil(items.length / rows);
    const padTop = 34, cw = kw / cols, ch = (kh - padTop) / rows;
    items.forEach(function (it, i) {
      const col = i % cols, row = Math.floor(i / cols);
      toWorld(kx + cw * (col + 0.5), ky + padTop + ch * (row + 0.5), tmp);
      it.tidy.pos.copy(tmp);
      it.tidy.scale = Math.min(cw * 0.74 * upp / it.tidyW, ch * 0.8 * upp / it.tidyH);
    });
  }

  /* ---------- pointer: the mess shies away, the flat-lay tilts gently ---------- */
  const pointer = { on: false, x: 0, y: 0, world: new THREE.Vector3() };
  let pointerUntil = 0;
  section.addEventListener('pointermove', function (e) {
    const s = section.getBoundingClientRect();
    pointer.on = true; pointer.x = e.clientX - s.left; pointer.y = e.clientY - s.top;
    toWorld(pointer.x, pointer.y, pointer.world);
    pointerUntil = performance.now() + 1200;
    kick();
  });
  section.addEventListener('pointerleave', function () { pointer.on = false; pointerUntil = performance.now() + 900; kick(); });

  /* ---------- the timeline ---------- */
  let mode = 'tidy', p = 1, from = 1, to = 1, tStart = 0, tDur = 1, autoTimer = 0, introStart = 0;
  const ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  function goChaos() {
    clearTimeout(autoTimer);
    mode = 'chaos'; p = 0;
    section.classList.remove('is-tidy');
    section.classList.add('is-chaos');
    autoTimer = setTimeout(tidyNow, CHAOS_MS);
    kick();
  }
  function tidyNow() {
    if (mode !== 'chaos' && mode !== 'untidying') { return; }
    clearTimeout(autoTimer);
    mode = 'tidying'; from = p; to = 1; tStart = performance.now(); tDur = TIDY_MS * (1 - p);
    section.classList.remove('is-chaos');
    setTimeout(function () { if (mode === 'tidying' || mode === 'tidy') { section.classList.add('is-tidy'); } }, TIDY_MS * 0.35);
    kick();
  }
  function replay() {
    if (reduced) { return; }
    clearTimeout(autoTimer);
    mode = 'untidying'; from = p; to = 0; tStart = performance.now(); tDur = UNTIDY_MS;
    section.classList.remove('is-tidy');
    section.classList.add('is-chaos');
    autoTimer = setTimeout(tidyNow, UNTIDY_MS + CHAOS_MS);
    kick();
  }

  /* Anything that says "I'm here to read" during the mess tidies it up at once. */
  ['wheel', 'touchmove', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (mode === 'chaos') { tidyNow(); } }, { passive: true });
  });
  section.addEventListener('pointerdown', function () { if (mode === 'chaos') { tidyNow(); } });
  if (replayBtn) {
    if (reduced) { replayBtn.hidden = true; }
    replayBtn.addEventListener('click', replay);
  }

  /* ---------- drawing ---------- */
  const qChaos = new THREE.Quaternion(), qTilt = new THREE.Quaternion(), eTmp = new THREE.Euler(), vTmp = new THREE.Vector3();
  let visible = true, raf = 0;
  window.__opFrames = 0;

  function frame(now) {
    raf = 0;
    const t = now / 1000;
    if (mode === 'tidying' || mode === 'untidying') {
      const k = tDur > 0 ? Math.min(1, (now - tStart) / tDur) : 1;
      p = from + (to - from) * k;
      if (k >= 1) {
        if (mode === 'tidying') { mode = 'tidy'; section.classList.add('is-tidy'); }
        else { mode = 'chaos'; }
      }
    }
    const intro = mode === 'chaos' && introStart ? Math.min(1, (now - introStart) / 700) : 1;

    items.forEach(function (it) {
      const local = ease(THREE.MathUtils.clamp((p - it.delay) / (1 - maxDelay), 0, 1));
      /* chaos pose, drifting and turning */
      vTmp.set(Math.sin(t * it.freq + it.phase) * 0.35, Math.cos(t * it.freq * 0.8 + it.phase) * 0.3, Math.sin(t * it.freq * 0.6 + it.phase) * 0.45);
      const targetPush = new THREE.Vector3();
      if (pointer.on && local < 1) {
        const dx = it.chaos.pos.x + vTmp.x - pointer.world.x, dy = it.chaos.pos.y + vTmp.y - pointer.world.y, d = Math.hypot(dx, dy), R = 2.6;
        if (d < R && d > 0.001) { targetPush.set(dx / d, dy / d, 0).multiplyScalar((R - d) * 0.55); }
      }
      it.push.lerp(targetPush, 0.08);
      eTmp.set(it.chaosRot.x + t * it.spin.x, it.chaosRot.y + t * it.spin.y, it.chaosRot.z + t * it.spin.z);
      qChaos.setFromEuler(eTmp);
      /* tidy pose, with a small tilt toward the pointer */
      qTilt.copy(it.tidyQ);
      if (pointer.on && !reduced && local > 0.99) {
        const tx = THREE.MathUtils.clamp((pointer.world.y - it.tidy.pos.y) * 0.04, -0.18, 0.18);
        const ty = THREE.MathUtils.clamp((it.tidy.pos.x - pointer.world.x) * -0.04, -0.18, 0.18);
        qTilt.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-tx, ty, 0)));
      }
      it.obj.quaternion.slerpQuaternions(qChaos, qTilt, local);
      it.obj.position.copy(it.chaos.pos).add(vTmp).add(it.push).lerp(it.tidy.pos, local);
      it.obj.position.z += Math.sin(local * Math.PI) * 1.4;
      const sc = THREE.MathUtils.lerp(it.chaos.scale, it.tidy.scale, local) * (local < 0.5 ? intro : 1);
      it.obj.scale.setScalar(Math.max(0.0001, sc));
    });

    const wk = ease(THREE.MathUtils.clamp(p * 1.6, 0, 1));
    word.visible = wk < 0.999;
    word.position.copy(wordPose.pos);
    word.position.y += Math.sin(t * 0.8) * 0.15;
    word.rotation.set(Math.sin(t * 0.5) * 0.12, Math.sin(t * 0.6) * 0.35, Math.sin(t * 0.4) * 0.05);
    word.scale.setScalar(Math.max(0.0001, wordPose.scale * (1 - wk) * intro));

    floor.material.opacity = shadowMax * (0.15 + 0.85 * ease(p));
    renderer.render(scene, camera);
    window.__opFrames++;
    if (shouldRun(now)) { raf = requestAnimationFrame(frame); }
  }
  function shouldRun(now) {
    if (!visible || document.hidden) { return false; }
    return mode !== 'tidy' || now < pointerUntil || items.some(function (it) { return it.push.lengthSq() > 0.0004; });
  }
  function kick() { if (!raf && visible && !document.hidden) { raf = requestAnimationFrame(frame); } }

  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }).observe(section);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(function () { layout(); kick(); }).observe(section);

  /* ---------- go ---------- */
  layout();
  section.classList.add('op-3d');
  if (!reduced && root.classList.contains('op-js')) {
    introStart = performance.now();
    goChaos();
  } else {
    /* reduced motion, or 3D arrived after the page had already shown itself: no mess, just the flat-lay */
    mode = 'tidy'; p = 1;
    section.classList.add('is-tidy');
    kick();
  }
}
