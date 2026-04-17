import { ViewCamera } from './camera';
import { multiplyMat4, perspectiveMatrix, lookAtMatrix, translationMatrix, scalingMatrix, rotateXMatrix, rotateYMatrix, rotateZMatrix, transposeMatrix, inverseMatrix, } from './math';
import { parseOBJFile, buildSphereMesh, buildCubeMesh } from './geometry';
import shaderSource from './shader.wgsl?raw';
export const SHADING_MODES = ['Gouraud', 'Phong', 'Normals', 'Wireframe', 'Depth', 'Texture', 'UVCoords'];
const SHADING_IDX = {
    Gouraud: 0, Phong: 1, Normals: 2, Wireframe: 3, Depth: 4, Texture: 5, UVCoords: 6
};
export class RenderNode {
    constructor() {
        this.id = 0;
        this.name = '';
        this.posX = 0;
        this.posY = 0;
        this.posZ = 0;
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
        this.sclX = 1;
        this.sclY = 1;
        this.sclZ = 1;
        this.ka = 0.12;
        this.kd = 0.75;
        this.ks = 0.55;
        this.shininess = 48;
        this.color = [0.27, 0.57, 0.82];
        this.useTexture = false;
        this.textureData = null;
        this._triBuffer = null;
        this._edgeBuffer = null;
        this._triCount = 0;
        this._edgeCount = 0;
        this._gpuTex = null;
        this._gpuTexView = null;
        this.boundCenter = [0, 0, 0];
        this.boundRadius = 1;
    }
}
let _uid = 1;
function newNode(name) {
    const n = new RenderNode();
    n.id = _uid++;
    n.name = name;
    return n;
}
export class RenderPipeline {
    constructor() {
        this.viewCam = new ViewCamera();
        this.shadingMode = 'Phong';
        this.lightTint = [1, 1, 1];
        this.nodes = [];
        this.activeId = null;
    }
    async init(canvas) {
        this.cvs = canvas;
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter)
            throw new Error('No WebGPU adapter found.');
        this.gpu = await adapter.requestDevice();
        this.ctx = canvas.getContext('webgpu');
        this.swapFmt = navigator.gpu.getPreferredCanvasFormat();
        this.ctx.configure({ device: this.gpu, format: this.swapFmt, alphaMode: 'opaque' });
        this._initBuffers();
        await this._initPipelines();
        this._resetDepthBuffer();
        this.defaultSamp = this.gpu.createSampler({
            magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear',
            addressModeU: 'repeat', addressModeV: 'repeat',
        });
        this.blankTex = this.gpu.createTexture({
            size: [1, 1, 1], format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.gpu.queue.writeTexture({ texture: this.blankTex }, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4 }, { width: 1, height: 1 });
        this.blankView = this.blankTex.createView();
    }
    _initBuffers() {
        const g = this.gpu;
        this.camBuf = g.createBuffer({ size: 144, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.xformBuf = g.createBuffer({ size: 128, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.surfBuf = g.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.lightBuf = g.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    }
    async _initPipelines() {
        const g = this.gpu;
        const sh = g.createShaderModule({ code: shaderSource });
        this.bindLayout = g.createBindGroupLayout({ entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                { binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
            ] });
        const pipeLayout = g.createPipelineLayout({ bindGroupLayouts: [this.bindLayout] });
        const vtxLayout = [{
                arrayStride: 8 * 4,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x3' },
                    { shaderLocation: 1, offset: 12, format: 'float32x3' },
                    { shaderLocation: 2, offset: 24, format: 'float32x2' },
                ]
            }];
        const depthState = { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' };
        this.solidPass = await g.createRenderPipelineAsync({
            layout: pipeLayout,
            vertex: { module: sh, entryPoint: 'vs_main', buffers: vtxLayout },
            fragment: { module: sh, entryPoint: 'fs_main', targets: [{ format: this.swapFmt }] },
            primitive: { topology: 'triangle-list', cullMode: 'back' },
            depthStencil: depthState,
        });
        this.edgePass = await g.createRenderPipelineAsync({
            layout: pipeLayout,
            vertex: { module: sh, entryPoint: 'vs_edges', buffers: vtxLayout },
            fragment: { module: sh, entryPoint: 'fs_edges', targets: [{ format: this.swapFmt }] },
            primitive: { topology: 'line-list' },
            depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less-equal' },
        });
    }
    _resetDepthBuffer() {
        if (this.depthBuf)
            this.depthBuf.destroy();
        this.depthBuf = this.gpu.createTexture({
            size: [this.cvs.width, this.cvs.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }
    _makeBindings(node) {
        const tv = (node.useTexture && node._gpuTexView) ? node._gpuTexView : this.blankView;
        return this.gpu.createBindGroup({
            layout: this.bindLayout,
            entries: [
                { binding: 0, resource: { buffer: this.camBuf } },
                { binding: 1, resource: { buffer: this.xformBuf } },
                { binding: 2, resource: { buffer: this.surfBuf } },
                { binding: 3, resource: { buffer: this.lightBuf } },
                { binding: 4, resource: this.defaultSamp },
                { binding: 5, resource: tv },
            ]
        });
    }
    _writeCamera() {
        const eye = this.viewCam.computePosition();
        const view = lookAtMatrix(eye, this.viewCam.pivotPoint, [0, 1, 0]);
        const proj = perspectiveMatrix(Math.PI / 4, this.cvs.width / this.cvs.height, this.viewCam.nearPlane(), this.viewCam.farPlane());
        const buf = new Float32Array(36);
        buf.set(view, 0);
        buf.set(proj, 16);
        buf[32] = eye[0];
        buf[33] = eye[1];
        buf[34] = eye[2];
        this.gpu.queue.writeBuffer(this.camBuf, 0, buf);
    }
    _writeTransform(node) {
        const world = multiplyMat4(translationMatrix(node.posX, node.posY, node.posZ), multiplyMat4(rotateYMatrix(node.rotY * Math.PI / 180), multiplyMat4(rotateXMatrix(node.rotX * Math.PI / 180), multiplyMat4(rotateZMatrix(node.rotZ * Math.PI / 180), scalingMatrix(node.sclX, node.sclY, node.sclZ)))));
        const nmat = transposeMatrix(inverseMatrix(world));
        const buf = new Float32Array(32);
        buf.set(world, 0);
        buf.set(nmat, 16);
        this.gpu.queue.writeBuffer(this.xformBuf, 0, buf);
    }
    _writeSurface(node) {
        const buf = new Float32Array(12);
        buf[0] = node.color[0];
        buf[1] = node.color[1];
        buf[2] = node.color[2];
        buf[3] = 1;
        buf[4] = node.ka;
        buf[5] = node.kd;
        buf[6] = node.ks;
        buf[7] = node.shininess;
        const dv = new DataView(buf.buffer);
        dv.setUint32(32, SHADING_IDX[this.shadingMode] ?? 1, true);
        dv.setUint32(36, (node.useTexture && node._gpuTexView) ? 1 : 0, true);
        this.gpu.queue.writeBuffer(this.surfBuf, 0, buf);
    }
    _writeLight() {
        const eye = this.viewCam.computePosition();
        const buf = new Float32Array(8);
        buf[0] = eye[0] + 0;
        buf[1] = eye[1] + 5;
        buf[2] = eye[2] + 3;
        buf[4] = this.lightTint[0];
        buf[5] = this.lightTint[1];
        buf[6] = this.lightTint[2];
        this.gpu.queue.writeBuffer(this.lightBuf, 0, buf);
    }
    async loadOBJ(url, label = 'Model', autoFit = true) {
        const geo = await parseOBJFile(url);
        const node = newNode(label);
        node.boundCenter = geo.center;
        node.boundRadius = geo.radius;
        this._uploadGeometry(node, geo);
        this.nodes.push(node);
        if (autoFit)
            this.viewCam.fitToObject(geo.center, geo.radius);
        return node;
    }
    spawnSphere(radius = 1, autoFit = true) {
        const geo = buildSphereMesh(radius, 32, 32);
        const node = newNode('Sphere');
        node.boundCenter = geo.center;
        node.boundRadius = geo.radius;
        this._uploadGeometry(node, geo);
        this.nodes.push(node);
        if (autoFit)
            this.viewCam.fitToObject(geo.center, geo.radius);
        return node;
    }
    spawnCube(size = 1, autoFit = true) {
        const geo = buildCubeMesh(size);
        const node = newNode('Cube');
        node.boundCenter = geo.center;
        node.boundRadius = geo.radius;
        this._uploadGeometry(node, geo);
        this.nodes.push(node);
        if (autoFit)
            this.viewCam.fitToObject(geo.center, geo.radius);
        return node;
    }
    _uploadGeometry(node, geo) {
        const flat = geo.toInterleavedArray();
        if (node._triBuffer)
            node._triBuffer.destroy();
        node._triBuffer = this.gpu.createBuffer({
            size: flat.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.gpu.queue.writeBuffer(node._triBuffer, 0, flat);
        node._triCount = flat.length / 8;
        const edgeVerts = [];
        const idx = geo.indices;
        for (let f = 0; f < idx.length; f += 3) {
            for (const [a, b] of [[idx[f], idx[f + 1]], [idx[f + 1], idx[f + 2]], [idx[f + 2], idx[f]]]) {
                const p = geo.positions, n = geo.normals, u = geo.uvs;
                edgeVerts.push(p[a * 3], p[a * 3 + 1], p[a * 3 + 2], n[a * 3], n[a * 3 + 1], n[a * 3 + 2], u[a * 2], u[a * 2 + 1], p[b * 3], p[b * 3 + 1], p[b * 3 + 2], n[b * 3], n[b * 3 + 1], n[b * 3 + 2], u[b * 2], u[b * 2 + 1]);
            }
        }
        const edgeArr = new Float32Array(edgeVerts);
        if (node._edgeBuffer)
            node._edgeBuffer.destroy();
        node._edgeBuffer = this.gpu.createBuffer({
            size: edgeArr.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.gpu.queue.writeBuffer(node._edgeBuffer, 0, edgeArr);
        node._edgeCount = edgeArr.length / 8;
    }
    dropNode(id) {
        const i = this.nodes.findIndex(n => n.id === id);
        if (i < 0)
            return;
        const n = this.nodes[i];
        n._triBuffer?.destroy();
        n._edgeBuffer?.destroy();
        n._gpuTex?.destroy();
        this.nodes.splice(i, 1);
    }
    async assignTexture(node, bitmap) {
        node._gpuTex?.destroy();
        const tex = this.gpu.createTexture({
            size: [bitmap.width, bitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.gpu.queue.copyExternalImageToTexture({ source: bitmap }, { texture: tex }, [bitmap.width, bitmap.height]);
        node._gpuTex = tex;
        node._gpuTexView = tex.createView();
        node.textureData = bitmap;
    }
    draw() {
        if (this.cvs.width < 1 || this.cvs.height < 1)
            return;
        this._writeCamera();
        this._writeLight();
        const enc = this.gpu.createCommandEncoder();
        const colView = this.ctx.getCurrentTexture().createView();
        const depView = this.depthBuf.createView();
        const wireMode = this.shadingMode === 'Wireframe';
        const pass = enc.beginRenderPass({
            colorAttachments: [{ view: colView, clearValue: { r: 0.04, g: 0.05, b: 0.09, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
            depthStencilAttachment: { view: depView, depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' }
        });
        for (const node of this.nodes) {
            if (!node._triBuffer || node._triCount === 0)
                continue;
            this._writeTransform(node);
            const bg = this._makeBindings(node);
            if (wireMode) {
                this._writeSurface(node);
                pass.setPipeline(this.solidPass);
                pass.setBindGroup(0, bg);
                pass.setVertexBuffer(0, node._triBuffer);
                pass.draw(node._triCount);
                if (node._edgeBuffer && node._edgeCount > 0) {
                    pass.setPipeline(this.edgePass);
                    pass.setBindGroup(0, bg);
                    pass.setVertexBuffer(0, node._edgeBuffer);
                    pass.draw(node._edgeCount);
                }
            }
            else {
                this._writeSurface(node);
                pass.setPipeline(this.solidPass);
                pass.setBindGroup(0, bg);
                pass.setVertexBuffer(0, node._triBuffer);
                pass.draw(node._triCount);
            }
        }
        pass.end();
        this.gpu.queue.submit([enc.finish()]);
    }
}
