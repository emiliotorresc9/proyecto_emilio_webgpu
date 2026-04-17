import { OrbitCamera } from './orbit_camera';
import {
  mat4Multiply, mat4Perspective, mat4LookAt,
  mat4Translate, mat4Scale, mat4RotateX, mat4RotateY, mat4RotateZ,
  mat4Transpose, mat4Inverse,
} from './linalg';
import { parseOBJFile, GeometryData, buildSphereGeometry, buildCubeGeometry } from './geometry';

// Target radius for auto-normalisation: all objects are scaled to fit this
const TARGET_RADIUS = 1.0;

// Convert unit quaternion [w,x,y,z] to a column-major 4×4 rotation matrix
function quatToMat4(q: [number,number,number,number]): Float32Array {
  const [w,x,y,z] = q;
  const m = new Float32Array(16);
  m[0]=1-2*(y*y+z*z); m[1]=2*(x*y+w*z);   m[2]=2*(x*z-w*y);   m[3]=0;
  m[4]=2*(x*y-w*z);   m[5]=1-2*(x*x+z*z); m[6]=2*(y*z+w*x);   m[7]=0;
  m[8]=2*(x*z+w*y);   m[9]=2*(y*z-w*x);   m[10]=1-2*(x*x+y*y);m[11]=0;
  m[12]=0;             m[13]=0;             m[14]=0;             m[15]=1;
  return m;
}

// Multiply two quaternions (q1 * q2)
export function quatMultiply(
  a: [number,number,number,number],
  b: [number,number,number,number]
): [number,number,number,number] {
  const [aw,ax,ay,az] = a, [bw,bx,by,bz] = b;
  return [
    aw*bw - ax*bx - ay*by - az*bz,
    aw*bx + ax*bw + ay*bz - az*by,
    aw*by - ax*bz + ay*bw + az*bx,
    aw*bz + ax*by - ay*bx + az*bw,
  ];
}

export const SHADE_MODES = ['Gouraud','Phong','Normals','Wireframe','Depth','Texture','UVCoords'] as const;
export type ShadeMode = typeof SHADE_MODES[number];

const SHADE_IDX: Record<ShadeMode, number> = {
  Gouraud:0, Phong:1, Normals:2, Wireframe:3, Depth:4, Texture:5, UVCoords:6
};

export class SceneNode {
  id   = 0;
  name = '';
  translateX = 0; translateY = 0; translateZ = 0;
  rotateX    = 0; rotateY    = 0; rotateZ    = 0;
  scaleX     = 1; scaleY     = 1; scaleZ     = 1;
  // Trackball quaternion rotation (w, x, y, z)
  quatRotation: [number,number,number,number] = [1, 0, 0, 0];
  ka = 0.12; kd = 0.75; ks = 0.55; shininess = 48;
  color: [number,number,number] = [0.27, 0.57, 0.82];
  useTexture  = false;
  textureData : ImageBitmap | null = null;

  // GPU-side buffers
  _vertBuf  : GPUBuffer      | null = null;
  _wireBuf  : GPUBuffer      | null = null;
  _vertCount = 0;
  _wireCount = 0;
  _gpuTex   : GPUTexture     | null = null;
  _texView  : GPUTextureView | null = null;

  // Per-node uniform buffers (so each node has independent GPU state)
  _bufModel : GPUBuffer | null = null;
  _bufSurf  : GPUBuffer | null = null;

  // Bounding sphere for camera fit
  boundCenter : [number,number,number] = [0,0,0];
  boundRadius  = 1;
}

let _uid = 1;
function newNode(name: string): SceneNode {
  const n = new SceneNode(); n.id = _uid++; n.name = name; return n;
}

export class SceneRenderer {
  device !: GPUDevice;
  context!: GPUCanvasContext;
  format !: GPUTextureFormat;
  canvas !: HTMLCanvasElement;

  solidPipeline!: GPURenderPipeline;
  edgePipeline !: GPURenderPipeline;
  bindLayout   !: GPUBindGroupLayout;

  bufCamera!: GPUBuffer;
  bufModel !: GPUBuffer;
  bufSurf  !: GPUBuffer;
  bufLight !: GPUBuffer;
  depthTex !: GPUTexture;

  camera    = new OrbitCamera();
  shadeMode : ShadeMode = 'Phong';
  lightColor: [number,number,number] = [1,1,1];
  nodes     : SceneNode[] = [];
  activeId  : number | null = null;

  defaultSampler!: GPUSampler;
  blankTex      !: GPUTexture;
  blankView     !: GPUTextureView;

  async init(canvas: HTMLCanvasElement) {
    this.canvas  = canvas;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No WebGPU adapter found.');
    this.device  = await adapter.requestDevice();
    this.context = canvas.getContext('webgpu')!;
    this.format  = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device: this.device, format: this.format, alphaMode: 'opaque' });

    this._initUniforms();
    await this._initPipelines();
    this._rebuildDepth();

    this.defaultSampler = this.device.createSampler({
      magFilter:'linear', minFilter:'linear', mipmapFilter:'linear',
      addressModeU:'repeat', addressModeV:'repeat',
    });
    this.blankTex = this.device.createTexture({
      size:[1,1,1], format:'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture(
      { texture: this.blankTex },
      new Uint8Array([255,255,255,255]),
      { bytesPerRow:4 }, { width:1, height:1 }
    );
    this.blankView = this.blankTex.createView();
  }

  _initUniforms() {
    const d = this.device;
    this.bufCamera = d.createBuffer({ size:144, usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST });
    this.bufModel  = d.createBuffer({ size:128, usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST });
    this.bufSurf   = d.createBuffer({ size:48,  usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST });
    this.bufLight  = d.createBuffer({ size:32,  usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST });
  }

  async _initPipelines() {
    const d    = this.device;
    const code = await fetch('/pipeline.wgsl').then(r => r.text());
    const sh   = d.createShaderModule({ code });

    // Catch WGSL compilation errors and surface them clearly
    const info = await sh.getCompilationInfo();
    const errors = info.messages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      throw new Error('WGSL shader error:\n' + errors.map(m => `  Line ${m.lineNum}: ${m.message}`).join('\n'));
    }

    this.bindLayout = d.createBindGroupLayout({ entries:[
      { binding:0, visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT, buffer:{type:'uniform'} },
      { binding:1, visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT, buffer:{type:'uniform'} },
      { binding:2, visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT, buffer:{type:'uniform'} },
      { binding:3, visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT, buffer:{type:'uniform'} },
      { binding:4, visibility:GPUShaderStage.FRAGMENT, sampler:{type:'filtering'} },
      { binding:5, visibility:GPUShaderStage.FRAGMENT, texture:{sampleType:'float'} },
    ]});

    const pipeLayout = d.createPipelineLayout({ bindGroupLayouts:[this.bindLayout] });
    const vtxLayout: GPUVertexBufferLayout[] = [{
      arrayStride: 8*4,
      attributes:[
        { shaderLocation:0, offset:0,  format:'float32x3' },
        { shaderLocation:1, offset:12, format:'float32x3' },
        { shaderLocation:2, offset:24, format:'float32x2' },
      ]
    }];
    const depthState: GPUDepthStencilState = {
      format:'depth24plus', depthWriteEnabled:true, depthCompare:'less'
    };

    this.solidPipeline = await d.createRenderPipelineAsync({
      layout: pipeLayout,
      vertex:   { module:sh, entryPoint:'vs_main', buffers:vtxLayout },
      fragment: { module:sh, entryPoint:'fs_main', targets:[{format:this.format}] },
      primitive:{ topology:'triangle-list', cullMode:'back' },
      depthStencil: depthState,
    });

    this.edgePipeline = await d.createRenderPipelineAsync({
      layout: pipeLayout,
      vertex:   { module:sh, entryPoint:'vs_wire', buffers:vtxLayout },
      fragment: { module:sh, entryPoint:'fs_wire', targets:[{format:this.format}] },
      primitive:{ topology:'line-list' },
      depthStencil:{ format:'depth24plus', depthWriteEnabled:false, depthCompare:'less-equal' },
    });
  }

  _rebuildDepth() {
    if (this.depthTex) this.depthTex.destroy();
    this.depthTex = this.device.createTexture({
      size:[this.canvas.width, this.canvas.height],
      format:'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  _makeBindGroup(node: SceneNode): GPUBindGroup {
    const tv = (node.useTexture && node._texView) ? node._texView : this.blankView;
    return this.device.createBindGroup({
      layout: this.bindLayout,
      entries:[
        { binding:0, resource:{ buffer:this.bufCamera } },
        { binding:1, resource:{ buffer:node._bufModel! } },
        { binding:2, resource:{ buffer:node._bufSurf!  } },
        { binding:3, resource:{ buffer:this.bufLight  } },
        { binding:4, resource:this.defaultSampler },
        { binding:5, resource:tv },
      ]
    });
  }

  _writeCamera() {
    const eye  = this.camera.getEyePosition();
    const view = mat4LookAt(eye, this.camera.target, [0,1,0]);
    const proj = mat4Perspective(
      Math.PI/4,
      this.canvas.width / this.canvas.height,
      this.camera.getNearPlane(),
      this.camera.getFarPlane()
    );
    const buf = new Float32Array(36);
    buf.set(view,0); buf.set(proj,16);
    buf[32]=eye[0]; buf[33]=eye[1]; buf[34]=eye[2];
    this.device.queue.writeBuffer(this.bufCamera, 0, buf);
  }

  _writeModel(node: SceneNode) {
    const qm = quatToMat4(node.quatRotation);
    const eulerRot = mat4Multiply(
      mat4RotateY(node.rotateY * Math.PI/180),
      mat4Multiply(
        mat4RotateX(node.rotateX * Math.PI/180),
        mat4RotateZ(node.rotateZ * Math.PI/180)
      )
    );
    // Orden: Translate → Rotate (euler + trackball) → Scale
    // La geometría ya está centrada en (0,0,0), así que rota en su propio punto.
    const model = mat4Multiply(
      mat4Translate(node.translateX, node.translateY, node.translateZ),
      mat4Multiply(
        mat4Multiply(eulerRot, qm),
        mat4Scale(node.scaleX, node.scaleY, node.scaleZ)
      )
    );
    // Normal matrix = transpose(inverse(model))
    const nmat = mat4Transpose(mat4Inverse(model));
    const buf  = new Float32Array(32);
    buf.set(model,0); buf.set(nmat,16);
    this.device.queue.writeBuffer(node._bufModel!, 0, buf);
  }

  _writeSurface(node: SceneNode) {
    const buf = new Float32Array(12);
    buf[0]=node.color[0]; buf[1]=node.color[1]; buf[2]=node.color[2]; buf[3]=1;
    buf[4]=node.ka; buf[5]=node.kd; buf[6]=node.ks; buf[7]=node.shininess;
    const dv = new DataView(buf.buffer);
    dv.setUint32(32, SHADE_IDX[this.shadeMode] ?? 1, true);
    dv.setUint32(36, (node.useTexture && node._texView) ? 1 : 0, true);
    this.device.queue.writeBuffer(node._bufSurf!, 0, buf);
  }

  _writeLight() {
    const eye = this.camera.getEyePosition();
    const buf = new Float32Array(8);
    buf[0]=eye[0]; buf[1]=eye[1]+5; buf[2]=eye[2]+3;
    buf[4]=this.lightColor[0]; buf[5]=this.lightColor[1]; buf[6]=this.lightColor[2];
    this.device.queue.writeBuffer(this.bufLight, 0, buf);
  }

  _uploadGeometry(node: SceneNode, geo: GeometryData) {
    const d = this.device;

    // Create per-node uniform buffers if not yet created
    if (!node._bufModel) {
      node._bufModel = d.createBuffer({ size:128, usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST });
    }
    if (!node._bufSurf) {
      node._bufSurf = d.createBuffer({ size:48,  usage: GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST });
    }

    const flat = geo.toFlatBuffer();
    if (node._vertBuf) node._vertBuf.destroy();
    node._vertBuf = this.device.createBuffer({
      size: flat.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(node._vertBuf, 0, flat);
    node._vertCount = flat.length / 8;

    // Build edge list for wireframe rendering
    const edgeVerts: number[] = [];
    const idx = geo.indices;
    for (let f=0; f<idx.length; f+=3) {
      for (const [a,b] of [[idx[f],idx[f+1]],[idx[f+1],idx[f+2]],[idx[f+2],idx[f]]]) {
        const p=geo.positions, n=geo.normals, u=geo.uvs;
        edgeVerts.push(
          p[a*3],p[a*3+1],p[a*3+2], n[a*3],n[a*3+1],n[a*3+2], u[a*2],u[a*2+1],
          p[b*3],p[b*3+1],p[b*3+2], n[b*3],n[b*3+1],n[b*3+2], u[b*2],u[b*2+1],
        );
      }
    }
    const edgeArr = new Float32Array(edgeVerts);
    if (node._wireBuf) node._wireBuf.destroy();
    node._wireBuf = this.device.createBuffer({
      size: edgeArr.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(node._wireBuf, 0, edgeArr);
    node._wireCount = edgeArr.length / 8;
  }

  async addFromOBJ(url: string, label = 'Model', fitCam = true): Promise<SceneNode> {
    const geo  = await parseOBJFile(url);
    const node = newNode(label);
    node.boundCenter = geo.center;
    node.boundRadius = geo.radius;

    // Auto-normalise: scale so every model appears the same size (~TARGET_RADIUS)
    node.scaleX = TARGET_RADIUS; node.scaleY = TARGET_RADIUS; node.scaleZ = TARGET_RADIUS;

    this._uploadGeometry(node, geo);
    this.nodes.push(node);
    if (fitCam) this.camera.fitToObject([0,0,0], TARGET_RADIUS);
    return node;
  }

  addSphere(radius = 1, fitCam = true): SceneNode {
    const geo  = buildSphereGeometry(radius, 32, 32);
    const node = newNode('Sphere');
    node.boundCenter = geo.center;
    node.boundRadius = geo.radius;
    // Normalise to TARGET_RADIUS
    node.scaleX = TARGET_RADIUS; node.scaleY = TARGET_RADIUS; node.scaleZ = TARGET_RADIUS;
    this._uploadGeometry(node, geo);
    this.nodes.push(node);
    if (fitCam) this.camera.fitToObject([0,0,0], TARGET_RADIUS);
    return node;
  }

  addCube(size = 1, fitCam = true): SceneNode {
    const geo  = buildCubeGeometry(size);
    const node = newNode('Cube');
    node.boundCenter = geo.center;
    node.boundRadius = geo.radius;
    // Normalise to TARGET_RADIUS
    node.scaleX = TARGET_RADIUS; node.scaleY = TARGET_RADIUS; node.scaleZ = TARGET_RADIUS;
    this._uploadGeometry(node, geo);
    this.nodes.push(node);
    if (fitCam) this.camera.fitToObject([0,0,0], TARGET_RADIUS);
    return node;
  }

  removeNode(id: number) {
    const i = this.nodes.findIndex(n => n.id===id);
    if (i<0) return;
    const n = this.nodes[i];
    n._vertBuf?.destroy(); n._wireBuf?.destroy(); n._gpuTex?.destroy();
    n._bufModel?.destroy(); n._bufSurf?.destroy();
    this.nodes.splice(i,1);
  }

  async assignTexture(node: SceneNode, bitmap: ImageBitmap) {
    node._gpuTex?.destroy();
    const tex = this.device.createTexture({
      size:[bitmap.width, bitmap.height, 1],
      format:'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture({ source:bitmap },{ texture:tex },[bitmap.width,bitmap.height]);
    node._gpuTex    = tex;
    node._texView   = tex.createView();
    node.textureData = bitmap;
  }

  render() {
    if (this.canvas.width<1 || this.canvas.height<1) return;
    this._writeCamera();
    this._writeLight();

    const enc    = this.device.createCommandEncoder();
    const cv     = this.context.getCurrentTexture().createView();
    const dv     = this.depthTex.createView();
    const isWire = this.shadeMode === 'Wireframe';

    const pass = enc.beginRenderPass({
      colorAttachments:[{ view:cv, clearValue:{r:0.04,g:0.05,b:0.09,a:1}, loadOp:'clear', storeOp:'store' }],
      depthStencilAttachment:{ view:dv, depthClearValue:1, depthLoadOp:'clear', depthStoreOp:'store' }
    });

    for (const node of this.nodes) {
      if (!node._vertBuf || node._vertCount===0) continue;
      this._writeModel(node);
      const bg = this._makeBindGroup(node);

      if (isWire) {
        // Draw solid fill first (populates depth buffer), then wire edges on top
        this._writeSurface(node);
        pass.setPipeline(this.solidPipeline);
        pass.setBindGroup(0, bg);
        pass.setVertexBuffer(0, node._vertBuf);
        pass.draw(node._vertCount);

        if (node._wireBuf && node._wireCount>0) {
          pass.setPipeline(this.edgePipeline);
          pass.setBindGroup(0, bg);
          pass.setVertexBuffer(0, node._wireBuf);
          pass.draw(node._wireCount);
        }
      } else {
        this._writeSurface(node);
        pass.setPipeline(this.solidPipeline);
        pass.setBindGroup(0, bg);
        pass.setVertexBuffer(0, node._vertBuf);
        pass.draw(node._vertCount);
      }
    }

    pass.end();
    this.device.queue.submit([enc.finish()]);
  }
}
