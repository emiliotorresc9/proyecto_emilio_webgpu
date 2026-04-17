import { SceneRenderer, quatMultiply } from '../core/scene_renderer';
import '../ui/theme.css';
const renderer = new SceneRenderer();
const canvas = document.createElement('canvas');
canvas.id = 'gpuCanvas';
document.body.appendChild(canvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (renderer.depthTex)
        renderer._rebuildDepth();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
// ── Trackball (Virtual Arcball) helpers ──────────────────────────────────────
// Maps a 2-D screen point (in [-1,1]²) onto the surface of a unit hemisphere.
function projectToSphere(x, y) {
    const d2 = x * x + y * y;
    if (d2 <= 1.0) {
        // Inside unit circle → point is on the sphere
        return [x, y, Math.sqrt(1.0 - d2)];
    }
    else {
        // Outside → project onto the equator (normalise to unit length)
        const len = Math.sqrt(d2);
        return [x / len, y / len, 0];
    }
}
// Compute the quaternion that rotates from vector a to vector b
function quatFromVectors(a, b) {
    // Cross product gives rotation axis, dot product gives cos(angle)
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const axis = [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
    // w = dot (= cos(θ)), xyz = axis (= sin(θ) * axis_normalised)
    const q = [dot, axis[0], axis[1], axis[2]];
    // Normalise
    const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    return len > 0 ? [q[0] / len, q[1] / len, q[2] / len, q[3] / len] : [1, 0, 0, 0];
}
// Converts pixel position to normalised trackball coords in [-1,1]²
function toTrackballCoords(px, py) {
    const w = canvas.width, h = canvas.height;
    const r = Math.min(w, h) * 0.5;
    return [
        (px - w * 0.5) / r,
        -(py - h * 0.5) / r, // flip Y so up is positive
    ];
}
// ── Mouse state ───────────────────────────────────────────────────────────────
let dragging = false;
let lastX = 0, lastY = 0;
let trackStart = null;
canvas.addEventListener('mousedown', e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    if (renderer.activeId !== null) {
        const [tx, ty] = toTrackballCoords(e.clientX, e.clientY);
        trackStart = projectToSphere(tx, ty);
    }
    e.preventDefault();
});
window.addEventListener('mouseup', () => {
    dragging = false;
    trackStart = null;
});
window.addEventListener('mousemove', e => {
    if (!dragging)
        return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (renderer.activeId !== null) {
        // ── Trackball rotation for the selected object ──
        const node = renderer.nodes.find(n => n.id === renderer.activeId);
        if (node && trackStart) {
            const [tx, ty] = toTrackballCoords(e.clientX, e.clientY);
            const trackEnd = projectToSphere(tx, ty);
            const dq = quatFromVectors(trackStart, trackEnd);
            node.quatRotation = quatMultiply(dq, node.quatRotation);
            // Normalise accumulated quaternion to prevent drift
            const q = node.quatRotation;
            const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
            node.quatRotation = [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
            // Debug: confirm only one node is modified
            console.log(`Rotating node id=${node.id} name=${node.name}, total nodes=${renderer.nodes.length}`);
            trackStart = trackEnd;
            refreshPanel();
        }
    }
    else {
        // ── Standard orbit for the camera (no object selected) ──
        renderer.camera.orbit(dx, dy);
    }
});
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    renderer.camera.zoom(e.deltaY * 0.05);
}, { passive: false });
// UI layout
const ui = document.createElement('div');
ui.id = 'ui';
document.body.appendChild(ui);
ui.innerHTML = `
<div class="panel left-panel">
  <div class="panel-title">Render Pipeline</div>

  <div class="section-label">Add Primitive</div>
  <div class="add-grid">
    <button class="add-btn btn-sphere" id="btnSphere">Sphere</button>
    <button class="add-btn btn-cube"   id="btnCube">Cube</button>
    <button class="add-btn btn-teapot" id="btnTeapot">Teapot</button>
    <button class="add-btn btn-beacon" id="btnBeacon">Beacon</button>
  </div>

  <div class="section-label">Load OBJ File</div>
  <label class="file-label"><input type="file" id="objFile" accept=".obj">Choose .obj…</label>

  <div class="section-label">Shading Mode</div>
  <div class="mode-grid">
    <button class="mode-btn" data-mode="Gouraud">Gouraud</button>
    <button class="mode-btn active" data-mode="Phong">Phong</button>
    <button class="mode-btn" data-mode="Normals">Normals</button>
    <button class="mode-btn" data-mode="Wireframe">Wireframe</button>
    <button class="mode-btn" data-mode="Depth">Depth</button>
    <button class="mode-btn" data-mode="Texture">Texture</button>
    <button class="mode-btn wide" data-mode="UVCoords">UV Coords</button>
  </div>
  <div class="mode-desc" id="modeDesc">Phong: normals interpolated per fragment, lighting per pixel.</div>

  <div class="section-label">Light Color</div>
  <div class="color-row"><span>Global light</span><input type="color" id="lightColor" value="#ffffff"></div>

</div>

<div class="panel right-panel">
  <div class="panel-title">Scene</div>
  <div id="nodeList"></div>
  <button class="btn deselect-btn" id="btnDeselect">Deselect</button>
  <button class="btn remove-btn"   id="btnRemove">Remove</button>

  <div id="selInfo" style="display:none"></div>

  <div id="transformSection" style="display:none">
    <div class="section-label">Transform</div>
    <div id="transformSliders"></div>
    <div class="section-label">Material</div>
    <div id="materialSliders"></div>
    <div class="section-label">Texture (Spherical UV)</div>
    <label class="file-label"><input type="file" id="texFile" accept="image/*">Choose image…</label>
    <label class="checkbox-row"><input type="checkbox" id="useTexture"> Use texture</label>
  </div>
</div>
`;
// Shading mode descriptions
const modeLabels = {
    Gouraud: 'Gouraud: lighting computed per vertex, interpolated.',
    Phong: 'Phong: normals interpolated per fragment, lighting per pixel.',
    Normals: 'Normals: world-space normal buffer as RGB.',
    Wireframe: 'Wireframe: edges only, hidden surface removed via depth.',
    Depth: 'Depth: depth buffer visualization.',
    Texture: 'Texture: spherical UV + Blinn-Phong lighting.',
    UVCoords: 'UV Coords: spherical texture coordinates as RG.',
};
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        renderer.shadeMode = mode;
        document.getElementById('modeDesc').textContent = modeLabels[mode] ?? '';
    });
});
// Scene node list
function refreshNodeList() {
    const list = document.getElementById('nodeList');
    list.innerHTML = '';
    renderer.nodes.forEach((node, i) => {
        const el = document.createElement('div');
        el.className = 'scene-item' + (node.id === renderer.activeId ? ' selected' : '');
        el.textContent = `${i + 1}. ${node.name}`;
        el.addEventListener('click', () => { renderer.activeId = node.id; refreshAll(); });
        list.appendChild(el);
    });
}
// Slider definitions
const transformDefs = [
    { label: 'Translate X', key: 'translateX', min: -200, max: 200, step: 0.1 },
    { label: 'Translate Y', key: 'translateY', min: -200, max: 200, step: 0.1 },
    { label: 'Translate Z', key: 'translateZ', min: -200, max: 200, step: 0.1 },
    { label: 'Rotate X', key: 'rotateX', min: -180, max: 180, step: 0.5 },
    { label: 'Rotate Y', key: 'rotateY', min: -180, max: 180, step: 0.5 },
    { label: 'Rotate Z', key: 'rotateZ', min: -180, max: 180, step: 0.5 },
    { label: 'Scale X', key: 'scaleX', min: 0.001, max: 10, step: 0.001 },
    { label: 'Scale Y', key: 'scaleY', min: 0.001, max: 10, step: 0.001 },
    { label: 'Scale Z', key: 'scaleZ', min: 0.001, max: 10, step: 0.001 },
];
const materialDefs = [
    { label: 'Ambient (Ka)', key: 'ka', min: 0, max: 1, step: 0.01 },
    { label: 'Diffuse (Kd)', key: 'kd', min: 0, max: 1, step: 0.01 },
    { label: 'Specular (Ks)', key: 'ks', min: 0, max: 1, step: 0.01 },
    { label: 'Shininess (n)', key: 'shininess', min: 1, max: 128, step: 1 },
];
function buildSliders(containerId, defs) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (const def of defs) {
        const row = document.createElement('div');
        row.className = 'slider-row';
        row.innerHTML = `<span class="slider-lbl">${def.label}</span>
      <input type="range" min="${def.min}" max="${def.max}" step="${def.step}" data-key="${def.key}">
      <span class="slider-val" data-val="${def.key}">0</span>`;
        container.appendChild(row);
        row.querySelector('input').addEventListener('input', e => {
            const node = getActive();
            if (!node)
                return;
            const v = parseFloat(e.target.value);
            node[def.key] = v;
            row.querySelector(`[data-val="${def.key}"]`).textContent = v.toFixed(3);
        });
    }
    // Color picker appended after material sliders
    if (containerId === 'materialSliders') {
        const cr = document.createElement('div');
        cr.className = 'color-row mat';
        cr.innerHTML = `<span>Object color</span><input type="color" id="objColor" value="#4592d2">`;
        container.appendChild(cr);
        document.getElementById('objColor').addEventListener('input', e => {
            const node = getActive();
            if (!node)
                return;
            const hex = e.target.value;
            node.color = [
                parseInt(hex.slice(1, 3), 16) / 255,
                parseInt(hex.slice(3, 5), 16) / 255,
                parseInt(hex.slice(5, 7), 16) / 255,
            ];
        });
    }
}
buildSliders('transformSliders', transformDefs);
buildSliders('materialSliders', materialDefs);
function refreshPanel() {
    const node = getActive();
    const info = document.getElementById('selInfo');
    const sec = document.getElementById('transformSection');
    if (!node) {
        info.textContent = 'NO SELECTION — CAMERA ORBIT MODE';
        info.style.display = 'block';
        sec.style.display = 'none';
        return;
    }
    info.style.display = 'none';
    sec.style.display = 'block';
    [...transformDefs, ...materialDefs].forEach(def => {
        const inp = document.querySelector(`input[data-key="${def.key}"]`);
        const val = document.querySelector(`[data-val="${def.key}"]`);
        if (inp && val) {
            inp.value = String(node[def.key]);
            val.textContent = Number(node[def.key]).toFixed(3);
        }
    });
    const oc = document.getElementById('objColor');
    if (oc) {
        const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
        oc.value = `#${h(node.color[0])}${h(node.color[1])}${h(node.color[2])}`;
    }
    const utx = document.getElementById('useTexture');
    if (utx)
        utx.checked = node.useTexture;
}
function refreshAll() { refreshNodeList(); refreshPanel(); }
function getActive() {
    return renderer.nodes.find(n => n.id === renderer.activeId) ?? null;
}
// Primitive buttons
document.getElementById('btnSphere').addEventListener('click', () => {
    const node = renderer.addSphere(1, true);
    renderer.activeId = node.id;
    refreshAll();
});
document.getElementById('btnCube').addEventListener('click', () => {
    const node = renderer.addCube(1, true);
    renderer.activeId = node.id;
    refreshAll();
});
document.getElementById('btnTeapot').addEventListener('click', async () => {
    const node = await renderer.addFromOBJ('/teapot.obj', 'Teapot', true);
    renderer.activeId = node.id;
    refreshAll();
});
document.getElementById('btnBeacon').addEventListener('click', async () => {
    const node = await renderer.addFromOBJ('/KAUST_Beacon.obj', 'KAUST_Beacon', true);
    renderer.activeId = node.id;
    refreshAll();
});
// Deselect / Remove
document.getElementById('btnDeselect').addEventListener('click', () => {
    renderer.activeId = null;
    refreshAll();
});
document.getElementById('btnRemove').addEventListener('click', () => {
    if (renderer.activeId === null)
        return;
    renderer.removeNode(renderer.activeId);
    renderer.activeId = null;
    refreshAll();
});
// Load custom OBJ file
document.getElementById('objFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file)
        return;
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.obj$/i, '');
    const node = await renderer.addFromOBJ(url, name, true);
    renderer.activeId = node.id;
    refreshAll();
    e.target.value = '';
});
// Texture upload
document.getElementById('texFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    const node = getActive();
    if (!file || !node)
        return;
    const bmp = await createImageBitmap(file);
    await renderer.assignTexture(node, bmp);
    refreshAll();
});
document.getElementById('useTexture').addEventListener('change', e => {
    const node = getActive();
    if (!node)
        return;
    node.useTexture = e.target.checked;
});
// Global light color
document.getElementById('lightColor').addEventListener('input', e => {
    const hex = e.target.value;
    renderer.lightColor = [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
    ];
});
// Init and render loop
(async () => {
    try {
        await renderer.init(canvas);
        refreshAll();
        function loop() { renderer.render(); requestAnimationFrame(loop); }
        requestAnimationFrame(loop);
    }
    catch (err) {
        document.body.innerHTML = `<div style="color:#f88;font-family:monospace;padding:2em;font-size:1.1em">
      WebGPU error: ${err}<br><br>Requires Chrome 113+ with WebGPU enabled.</div>`;
    }
})();
