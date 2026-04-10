import { RenderPipeline } from './pipeline';
import './style.css';

const engine = new RenderPipeline();

const renderCanvas = document.createElement('canvas');
renderCanvas.id = 'renderCanvas';
document.body.appendChild(renderCanvas);

function handleResize() {
  renderCanvas.width  = window.innerWidth;
  renderCanvas.height = window.innerHeight;
  if (engine.depthBuf) engine._resetDepthBuffer();
}
handleResize();
window.addEventListener('resize', handleResize);

let isDragging = false, prevX = 0, prevY = 0;
renderCanvas.addEventListener('mousedown', e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; e.preventDefault(); });
window.addEventListener('mouseup',   () => isDragging = false);
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - prevX, dy = e.clientY - prevY;
  prevX = e.clientX; prevY = e.clientY;
  if (engine.activeId !== null) {
    const node = engine.nodes.find(n => n.id === engine.activeId);
    if (node) { node.rotY += dx * 0.5; node.rotX += dy * 0.5; refreshPanel(); }
  } else {
    engine.viewCam.rotate(dx, dy);
  }
});
renderCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  engine.viewCam.adjustZoom(e.deltaY * 0.05);
}, { passive: false });

const overlay = document.createElement('div');
overlay.id = 'overlay';
document.body.appendChild(overlay);

overlay.innerHTML = `
<div class="panel left-panel">
  <div class="panel-title">RENDERER</div>

  <div class="section-label">RENDER MODE (GLOBAL)</div>
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

  <div class="section-label">GLOBAL LIGHT COLOR</div>
  <div class="color-row"><span>Light</span><input type="color" id="lightColorPicker" value="#ffffff"></div>

  <div class="section-label">ADD OBJECT</div>
  <div class="add-obj-row">
    <button class="add-btn sphere-btn" id="btnSphere">
      <span class="add-icon"></span> Sphere
    </button>
    <button class="add-btn cube-btn" id="btnCube">
      <span class="add-icon"></span> Cube
    </button>
  </div>
  <div class="add-obj-row">
    <button class="add-btn teapot-btn" id="btnTeapot">
      <span class="add-icon"></span> Teapot
    </button>
    <button class="add-btn beacon-btn" id="btnBeacon">
      <span class="add-icon"></span> Beacon
    </button>
  </div>

  <div class="section-label">LOAD OBJ FILE</div>
  <label class="file-label"><input type="file" id="objFileInput" accept=".obj">Select .obj file</label>

  <div class="hint">
    No selection: drag orbits camera<br>
    Object selected: drag rotates object<br>
    Scroll: zoom toward target
  </div>
</div>

<div class="panel right-panel">
  <div class="panel-title">SCENE</div>
  <div id="nodeList"></div>
  <button class="btn deselect-btn" id="btnDeselect">Deselect</button>
  <button class="btn remove-btn"   id="btnRemove">Remove</button>

  <div id="selectionStatus" class="no-sel-info">NO SELECTION — CAMERA ORBIT MODE</div>

  <div id="nodeControls" style="display:none">
    <div class="section-label">TRANSFORM</div>
    <div id="transformSliders"></div>
    <div class="section-label">MATERIAL</div>
    <div id="materialSliders"></div>
    <div class="section-label">TEXTURE (SPHERICAL UV)</div>
    <label class="file-label"><input type="file" id="texFileInput" accept="image/*">Select image</label>
    <label class="checkbox-row"><input type="checkbox" id="useTexToggle"> Use texture</label>
  </div>
</div>
`;

const modeDescriptions: Record<string,string> = {
  Gouraud:  'Gouraud: lighting computed per vertex, interpolated.',
  Phong:    'Phong: normals interpolated per fragment, lighting per pixel.',
  Normals:  'Normals: world-space normal buffer as RGB.',
  Wireframe:'Wireframe: edges only, hidden surface removed via depth.',
  Depth:    'Depth: depth buffer visualization.',
  Texture:  'Texture: spherical UV + Blinn-Phong lighting.',
  UVCoords: 'UV Coords: spherical texture coordinates as RG.',
};

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = (btn as HTMLElement).dataset.mode as any;
    engine.shadingMode = mode;
    document.getElementById('modeDesc')!.textContent = modeDescriptions[mode] ?? '';
  });
});

function refreshNodeList() {
  const list = document.getElementById('nodeList')!;
  list.innerHTML = '';
  engine.nodes.forEach((node, i) => {
    const el = document.createElement('div');
    el.className = 'scene-item' + (node.id === engine.activeId ? ' selected' : '');
    el.textContent = `${i+1}. ${node.name}`;
    el.addEventListener('click', () => { engine.activeId = node.id; refreshAll(); });
    list.appendChild(el);
  });
}

const transformProps = [
  { label:'Translate X', key:'posX', min:-200, max:200, step:0.1  },
  { label:'Translate Y', key:'posY', min:-200, max:200, step:0.1  },
  { label:'Translate Z', key:'posZ', min:-200, max:200, step:0.1  },
  { label:'Rotate X',    key:'rotX', min:-180, max:180, step:0.5  },
  { label:'Rotate Y',    key:'rotY', min:-180, max:180, step:0.5  },
  { label:'Rotate Z',    key:'rotZ', min:-180, max:180, step:0.5  },
  { label:'Scale X',     key:'sclX', min:0.001,max:10,  step:0.001},
  { label:'Scale Y',     key:'sclY', min:0.001,max:10,  step:0.001},
  { label:'Scale Z',     key:'sclZ', min:0.001,max:10,  step:0.001},
];
const materialProps = [
  { label:'Ambient (Ka)',  key:'ka',        min:0, max:1,   step:0.01 },
  { label:'Diffuse (Kd)',  key:'kd',        min:0, max:1,   step:0.01 },
  { label:'Specular (Ks)', key:'ks',        min:0, max:1,   step:0.01 },
  { label:'Shininess (n)', key:'shininess', min:1, max:128, step:1    },
];

function buildSliderGroup(containerId: string, props: typeof transformProps) {
  const box = document.getElementById(containerId)!;
  box.innerHTML = '';
  for (const prop of props) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `<span class="slider-lbl">${prop.label}</span>
      <input type="range" min="${prop.min}" max="${prop.max}" step="${prop.step}" data-key="${prop.key}">
      <span class="slider-val" data-val="${prop.key}">0</span>`;
    box.appendChild(row);
    row.querySelector('input')!.addEventListener('input', e => {
      const node = getActiveNode(); if (!node) return;
      const v = parseFloat((e.target as HTMLInputElement).value);
      (node as any)[prop.key] = v;
      row.querySelector<HTMLElement>(`[data-val="${prop.key}"]`)!.textContent = v.toFixed(3);
    });
  }
  if (containerId === 'materialSliders') {
    const cr = document.createElement('div');
    cr.className = 'color-row mat';
    cr.innerHTML = `<span>Object color</span><input type="color" id="nodeColorPicker" value="#4592d2">`;
    box.appendChild(cr);
    document.getElementById('nodeColorPicker')!.addEventListener('input', e => {
      const node = getActiveNode(); if (!node) return;
      const hex = (e.target as HTMLInputElement).value;
      node.color = [
        parseInt(hex.slice(1,3),16)/255,
        parseInt(hex.slice(3,5),16)/255,
        parseInt(hex.slice(5,7),16)/255,
      ];
    });
  }
}

buildSliderGroup('transformSliders', transformProps);
buildSliderGroup('materialSliders',  materialProps);

function refreshPanel() {
  const node   = getActiveNode();
  const status = document.getElementById('selectionStatus')!;
  const ctrls  = document.getElementById('nodeControls')!;
  if (!node) {
    status.textContent   = 'NO SELECTION — CAMERA ORBIT MODE';
    status.style.display = 'block';
    ctrls.style.display  = 'none';
    return;
  }
  status.style.display = 'none';
  ctrls.style.display  = 'block';
  [...transformProps, ...materialProps].forEach(prop => {
    const inp = document.querySelector<HTMLInputElement>(`input[data-key="${prop.key}"]`);
    const val = document.querySelector<HTMLElement>(`[data-val="${prop.key}"]`);
    if (inp && val) {
      inp.value       = String((node as any)[prop.key]);
      val.textContent = Number((node as any)[prop.key]).toFixed(3);
    }
  });
  const cp = document.getElementById('nodeColorPicker') as HTMLInputElement|null;
  if (cp) {
    const h = (v:number) => Math.round(v*255).toString(16).padStart(2,'0');
    cp.value = `#${h(node.color[0])}${h(node.color[1])}${h(node.color[2])}`;
  }
  const tog = document.getElementById('useTexToggle') as HTMLInputElement;
  if (tog) tog.checked = node.useTexture;
}

function refreshAll() { refreshNodeList(); refreshPanel(); }
function getActiveNode() { return engine.nodes.find(n => n.id === engine.activeId) ?? null; }

document.getElementById('btnDeselect')!.addEventListener('click', () => {
  engine.activeId = null; refreshAll();
});
document.getElementById('btnRemove')!.addEventListener('click', () => {
  if (engine.activeId === null) return;
  engine.dropNode(engine.activeId);
  engine.activeId = null;
  refreshAll();
});

document.getElementById('btnSphere')!.addEventListener('click', () => {
  const node = engine.spawnSphere(1, true);
  engine.activeId = node.id;
  refreshAll();
});
document.getElementById('btnCube')!.addEventListener('click', () => {
  const node = engine.spawnCube(1, true);
  engine.activeId = node.id;
  refreshAll();
});

document.getElementById('btnTeapot')!.addEventListener('click', async () => {
  const node = await engine.loadOBJ('/teapot.obj', 'Teapot', true);
  engine.activeId = node.id;
  refreshAll();
});
document.getElementById('btnBeacon')!.addEventListener('click', async () => {
  const node = await engine.loadOBJ('/KAUST_Beacon.obj', 'KAUST_Beacon', true);
  engine.activeId = node.id;
  refreshAll();
});

document.getElementById('objFileInput')!.addEventListener('change', async e => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const url  = URL.createObjectURL(file);
  const name = file.name.replace(/\.obj$/i, '');
  const node = await engine.loadOBJ(url, name, true);
  engine.activeId = node.id;
  refreshAll();
  (e.target as HTMLInputElement).value = '';
});

document.getElementById('texFileInput')!.addEventListener('change', async e => {
  const file = (e.target as HTMLInputElement).files?.[0];
  const node = getActiveNode(); if (!file || !node) return;
  const bmp  = await createImageBitmap(file);
  await engine.assignTexture(node, bmp);
  refreshAll();
});
document.getElementById('useTexToggle')!.addEventListener('change', e => {
  const node = getActiveNode(); if (!node) return;
  node.useTexture = (e.target as HTMLInputElement).checked;
});

document.getElementById('lightColorPicker')!.addEventListener('input', e => {
  const hex = (e.target as HTMLInputElement).value;
  engine.lightTint = [
    parseInt(hex.slice(1,3),16)/255,
    parseInt(hex.slice(3,5),16)/255,
    parseInt(hex.slice(5,7),16)/255,
  ];
});

(async () => {
  try {
    await engine.init(renderCanvas);
    refreshAll();
    function tick() { engine.draw(); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  } catch(err) {
    document.body.innerHTML = `<div style="color:#f99;font-family:monospace;padding:2em;font-size:1.1em">
      WebGPU error: ${err}<br><br>Requires Chrome 113+ with WebGPU enabled.</div>`;
  }
})();
