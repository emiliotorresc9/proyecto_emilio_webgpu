(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{azimuth=.3;elevation=.3;distance=8;pivotPoint=[0,0,0];rotate(e,t,n=.005){this.azimuth+=e*n,this.elevation=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,this.elevation-t*n))}adjustZoom(e){this.distance=Math.max(.5,this.distance+e)}fitToObject(e,t,n=Math.PI/4){this.pivotPoint=[...e],this.distance=t/Math.sin(n/2)*1.1}computePosition(){let e=Math.cos(this.elevation),t=Math.sin(this.elevation),n=Math.cos(this.azimuth),r=Math.sin(this.azimuth);return[this.pivotPoint[0]+this.distance*e*n,this.pivotPoint[1]+this.distance*t,this.pivotPoint[2]+this.distance*e*r]}nearPlane(){return Math.max(.01,this.distance*.01)}farPlane(){return this.distance*10+100}};function t(){let e=new Float32Array(16);return e[0]=e[5]=e[10]=e[15]=1,e}function n(e,t){let n=new Float32Array(16);for(let r=0;r<4;r++)for(let i=0;i<4;i++){let a=0;for(let n=0;n<4;n++)a+=e[r+n*4]*t[n+i*4];n[r+i*4]=a}return n}function r(e,t,n,r){let i=1/Math.tan(e/2),a=new Float32Array(16);return a[0]=i/t,a[5]=i,a[10]=r/(n-r),a[11]=-1,a[14]=n*r/(n-r),a}function i(e,t,n){let r=h(f(e,t)),i=h(m(n,r)),a=m(r,i),o=new Float32Array(16);return o[0]=i[0],o[4]=i[1],o[8]=i[2],o[1]=a[0],o[5]=a[1],o[9]=a[2],o[2]=r[0],o[6]=r[1],o[10]=r[2],o[12]=-p(i,e),o[13]=-p(a,e),o[14]=-p(r,e),o[15]=1,o}function a(e,n,r){let i=t();return i[12]=e,i[13]=n,i[14]=r,i}function o(e,t,n){let r=new Float32Array(16);return r[0]=e,r[5]=t,r[10]=n,r[15]=1,r}function s(e){let n=t();return n[5]=Math.cos(e),n[6]=Math.sin(e),n[9]=-Math.sin(e),n[10]=Math.cos(e),n}function c(e){let n=t();return n[0]=Math.cos(e),n[2]=-Math.sin(e),n[8]=Math.sin(e),n[10]=Math.cos(e),n}function l(e){let n=t();return n[0]=Math.cos(e),n[1]=Math.sin(e),n[4]=-Math.sin(e),n[5]=Math.cos(e),n}function u(e){let t=new Float32Array(16);for(let n=0;n<4;n++)for(let r=0;r<4;r++)t[n*4+r]=e[r*4+n];return t}function d(e){let n=new Float32Array(16);n[0]=e[5]*e[10]*e[15]-e[5]*e[11]*e[14]-e[9]*e[6]*e[15]+e[9]*e[7]*e[14]+e[13]*e[6]*e[11]-e[13]*e[7]*e[10],n[4]=-e[4]*e[10]*e[15]+e[4]*e[11]*e[14]+e[8]*e[6]*e[15]-e[8]*e[7]*e[14]-e[12]*e[6]*e[11]+e[12]*e[7]*e[10],n[8]=e[4]*e[9]*e[15]-e[4]*e[11]*e[13]-e[8]*e[5]*e[15]+e[8]*e[7]*e[13]+e[12]*e[5]*e[11]-e[12]*e[7]*e[9],n[12]=-e[4]*e[9]*e[14]+e[4]*e[10]*e[13]+e[8]*e[5]*e[14]-e[8]*e[6]*e[13]-e[12]*e[5]*e[10]+e[12]*e[6]*e[9],n[1]=-e[1]*e[10]*e[15]+e[1]*e[11]*e[14]+e[9]*e[2]*e[15]-e[9]*e[3]*e[14]-e[13]*e[2]*e[11]+e[13]*e[3]*e[10],n[5]=e[0]*e[10]*e[15]-e[0]*e[11]*e[14]-e[8]*e[2]*e[15]+e[8]*e[3]*e[14]+e[12]*e[2]*e[11]-e[12]*e[3]*e[10],n[9]=-e[0]*e[9]*e[15]+e[0]*e[11]*e[13]+e[8]*e[1]*e[15]-e[8]*e[3]*e[13]-e[12]*e[1]*e[11]+e[12]*e[3]*e[9],n[13]=e[0]*e[9]*e[14]-e[0]*e[10]*e[13]-e[8]*e[1]*e[14]+e[8]*e[2]*e[13]+e[12]*e[1]*e[10]-e[12]*e[2]*e[9],n[2]=e[1]*e[6]*e[15]-e[1]*e[7]*e[14]-e[5]*e[2]*e[15]+e[5]*e[3]*e[14]+e[13]*e[2]*e[7]-e[13]*e[3]*e[6],n[6]=-e[0]*e[6]*e[15]+e[0]*e[7]*e[14]+e[4]*e[2]*e[15]-e[4]*e[3]*e[14]-e[12]*e[2]*e[7]+e[12]*e[3]*e[6],n[10]=e[0]*e[5]*e[15]-e[0]*e[7]*e[13]-e[4]*e[1]*e[15]+e[4]*e[3]*e[13]+e[12]*e[1]*e[7]-e[12]*e[3]*e[5],n[14]=-e[0]*e[5]*e[14]+e[0]*e[6]*e[13]+e[4]*e[1]*e[14]-e[4]*e[2]*e[13]-e[12]*e[1]*e[6]+e[12]*e[2]*e[5],n[3]=-e[1]*e[6]*e[11]+e[1]*e[7]*e[10]+e[5]*e[2]*e[11]-e[5]*e[3]*e[10]-e[9]*e[2]*e[7]+e[9]*e[3]*e[6],n[7]=e[0]*e[6]*e[11]-e[0]*e[7]*e[10]-e[4]*e[2]*e[11]+e[4]*e[3]*e[10]+e[8]*e[2]*e[7]-e[8]*e[3]*e[6],n[11]=-e[0]*e[5]*e[11]+e[0]*e[7]*e[9]+e[4]*e[1]*e[11]-e[4]*e[3]*e[9]-e[8]*e[1]*e[7]+e[8]*e[3]*e[5],n[15]=e[0]*e[5]*e[10]-e[0]*e[6]*e[9]-e[4]*e[1]*e[10]+e[4]*e[2]*e[9]+e[8]*e[1]*e[6]-e[8]*e[2]*e[5];let r=e[0]*n[0]+e[1]*n[4]+e[2]*n[8]+e[3]*n[12];if(Math.abs(r)<1e-10)return t();r=1/r;for(let e=0;e<16;e++)n[e]*=r;return n}function f(e,t){return e.map((e,n)=>e-t[n])}function p(e,t){return e.reduce((e,n,r)=>e+n*t[r],0)}function m(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function h(e){let t=Math.hypot(...e)||1;return e.map(e=>e/t)}var g=class{positions;normals;uvs;indices;vertexCount;faceCount;boundsMin=[0,0,0];boundsMax=[0,0,0];center=[0,0,0];radius=1;constructor(e,t,n,r){this.positions=e,this.normals=t,this.uvs=n,this.indices=r,this.vertexCount=e.length/3,this.faceCount=r.length/3,this._calcBounds()}_calcBounds(){let e=1/0,t=1/0,n=1/0,r=-1/0,i=-1/0,a=-1/0;for(let o=0;o<this.positions.length;o+=3){let s=this.positions[o],c=this.positions[o+1],l=this.positions[o+2];s<e&&(e=s),s>r&&(r=s),c<t&&(t=c),c>i&&(i=c),l<n&&(n=l),l>a&&(a=l)}this.boundsMin=[e,t,n],this.boundsMax=[r,i,a],this.center=[(e+r)/2,(t+i)/2,(n+a)/2],this.radius=Math.hypot(r-e,i-t,a-n)/2}toInterleavedArray(){let e=new Float32Array(this.indices.length*8);for(let t=0;t<this.indices.length;t++){let n=this.indices[t],r=t*8;e[r+0]=this.positions[n*3+0],e[r+1]=this.positions[n*3+1],e[r+2]=this.positions[n*3+2],e[r+3]=this.normals[n*3+0],e[r+4]=this.normals[n*3+1],e[r+5]=this.normals[n*3+2],e[r+6]=this.uvs[n*2+0],e[r+7]=this.uvs[n*2+1]}return e}};async function _(e){let t=await fetch(e).then(e=>e.text()),n=[],r=[],i=[],a=new Map,o=[],s=[],c=[],l=[];for(let e of t.split(`
`)){let t=e.trim().split(/\s+/);if(t[0]===`v`&&n.push([+t[1],+t[2],+t[3]]),t[0]===`vt`&&r.push([+t[1],1-t[2]]),t[0]===`vn`&&i.push([+t[1],+t[2],+t[3]]),t[0]===`f`){let e=t.slice(1).map(e=>{let[t,n,r]=e.split(`/`).map(e=>e?e-1:-1);return{pi:t,ti:n,ni:r}});for(let t=1;t<e.length-1;t++)for(let u of[e[0],e[t],e[t+1]]){let e=`${u.pi}/${u.ti}/${u.ni}`;if(!a.has(e)){let t=o.length/3;a.set(e,t);let l=n[u.pi]??[0,0,0];o.push(l[0],l[1],l[2]);let d=u.ti>=0?r[u.ti]:[0,0];s.push(d[0],d[1]);let f=u.ni>=0?i[u.ni]:[0,0,0];c.push(f[0],f[1],f[2])}l.push(a.get(e))}}}let u=new Float32Array(o),d=new Uint32Array(l),f=new Float32Array(o.length);for(let e=0;e<d.length;e+=3){let t=d[e],n=d[e+1],r=d[e+2],i=u[t*3],a=u[t*3+1],o=u[t*3+2],s=u[n*3],c=u[n*3+1],l=u[n*3+2],p=u[r*3],m=u[r*3+1],h=u[r*3+2],g=s-i,_=c-a,v=l-o,y=p-i,b=m-a,x=h-o,S=_*x-v*b,C=v*y-g*x,w=g*b-_*y;for(let e of[t,n,r])f[e*3+0]+=S,f[e*3+1]+=C,f[e*3+2]+=w}for(let e=0;e<f.length;e+=3){let t=Math.hypot(f[e],f[e+1],f[e+2])||1;f[e]/=t,f[e+1]/=t,f[e+2]/=t}let p=0,m=0,h=0,_=u.length/3;for(let e=0;e<u.length;e+=3)p+=u[e],m+=u[e+1],h+=u[e+2];p/=_,m/=_,h/=_;let v=new Float32Array(_*2);for(let e=0;e<_;e++){let t=u[e*3]-p,n=u[e*3+1]-m,r=u[e*3+2]-h,i=Math.hypot(t,n,r)||1;v[e*2]=.5+Math.atan2(r/i,t/i)/(2*Math.PI),v[e*2+1]=.5-Math.asin(Math.max(-1,Math.min(1,n/i)))/Math.PI}return new g(u,f,v,d)}function v(e=1,t=32,n=32){let r=[],i=[],a=[],o=[];for(let o=0;o<=t;o++){let s=o/t*Math.PI,c=Math.sin(s),l=Math.cos(s);for(let s=0;s<=n;s++){let u=s/n*2*Math.PI,d=Math.sin(u),f=c*Math.cos(u),p=l,m=c*d;r.push(e*f,e*p,e*m),i.push(f,p,m),a.push(s/n,o/t)}}for(let e=0;e<t;e++)for(let t=0;t<n;t++){let r=e*(n+1)+t,i=r+n+1;o.push(r,i,r+1,i,i+1,r+1)}return new g(new Float32Array(r),new Float32Array(i),new Float32Array(a),new Uint32Array(o))}function y(e=1){let t=e/2,n=[[{pos:[t,-t,-t],n:[1,0,0],uv:[0,1]},{pos:[t,t,-t],n:[1,0,0],uv:[0,0]},{pos:[t,t,t],n:[1,0,0],uv:[1,0]},{pos:[t,-t,t],n:[1,0,0],uv:[1,1]}],[{pos:[-t,-t,t],n:[-1,0,0],uv:[0,1]},{pos:[-t,t,t],n:[-1,0,0],uv:[0,0]},{pos:[-t,t,-t],n:[-1,0,0],uv:[1,0]},{pos:[-t,-t,-t],n:[-1,0,0],uv:[1,1]}],[{pos:[-t,t,-t],n:[0,1,0],uv:[0,1]},{pos:[-t,t,t],n:[0,1,0],uv:[0,0]},{pos:[t,t,t],n:[0,1,0],uv:[1,0]},{pos:[t,t,-t],n:[0,1,0],uv:[1,1]}],[{pos:[-t,-t,t],n:[0,-1,0],uv:[0,1]},{pos:[-t,-t,-t],n:[0,-1,0],uv:[0,0]},{pos:[t,-t,-t],n:[0,-1,0],uv:[1,0]},{pos:[t,-t,t],n:[0,-1,0],uv:[1,1]}],[{pos:[-t,-t,t],n:[0,0,1],uv:[0,1]},{pos:[t,-t,t],n:[0,0,1],uv:[1,1]},{pos:[t,t,t],n:[0,0,1],uv:[1,0]},{pos:[-t,t,t],n:[0,0,1],uv:[0,0]}],[{pos:[t,-t,-t],n:[0,0,-1],uv:[1,1]},{pos:[-t,-t,-t],n:[0,0,-1],uv:[0,1]},{pos:[-t,t,-t],n:[0,0,-1],uv:[0,0]},{pos:[t,t,-t],n:[0,0,-1],uv:[1,0]}]],r=[],i=[],a=[],o=[];for(let e of n){let t=r.length/3;for(let t of e)r.push(...t.pos),i.push(...t.n),a.push(...t.uv);o.push(t,t+1,t+2,t,t+2,t+3)}return new g(new Float32Array(r),new Float32Array(i),new Float32Array(a),new Uint32Array(o))}var b=`struct CameraUniforms {
  viewMat   : mat4x4<f32>,
  projMat   : mat4x4<f32>,
  eyePos    : vec3<f32>,
  _pad0     : f32,
}
struct TransformUniforms {
  worldMat  : mat4x4<f32>,
  normalMat : mat4x4<f32>,
}
struct SurfaceUniforms {
  baseColor  : vec4<f32>,
  ambientK   : f32,
  diffuseK   : f32,
  specularK  : f32,
  glossiness : f32,
  shadingMode: u32,
  texEnabled : u32,
  _p0        : f32,
  _p1        : f32,
}
struct LightUniforms {
  lightPos   : vec3<f32>,
  _p0        : f32,
  lightColor : vec3<f32>,
  _p1        : f32,
}

@group(0) @binding(0) var<uniform> camData    : CameraUniforms;
@group(0) @binding(1) var<uniform> xformData  : TransformUniforms;
@group(0) @binding(2) var<uniform> surfData   : SurfaceUniforms;
@group(0) @binding(3) var<uniform> lightData  : LightUniforms;
@group(0) @binding(4) var texSampler          : sampler;
@group(0) @binding(5) var albedoTex           : texture_2d<f32>;

struct VertInput {
  @location(0) position : vec3<f32>,
  @location(1) normal   : vec3<f32>,
  @location(2) texcoord : vec2<f32>,
}
struct VertOutput {
  @builtin(position) clipPos  : vec4<f32>,
  @location(0) worldPos       : vec3<f32>,
  @location(1) worldNormal    : vec3<f32>,
  @location(2) texcoord       : vec2<f32>,
  @location(3) gouraudColor   : vec3<f32>,
  @location(4) linearDepth    : f32,
}

fn computeBlinnPhong(wpos: vec3<f32>, N: vec3<f32>) -> vec3<f32> {
  let L    = normalize(lightData.lightPos - wpos);
  let V    = normalize(camData.eyePos    - wpos);
  let H    = normalize(L + V);
  let dTerm = max(dot(N, L), 0.0);
  let sTerm = pow(max(dot(N, H), 0.0), surfData.glossiness);
  return (surfData.ambientK  * lightData.lightColor
        + surfData.diffuseK  * dTerm * lightData.lightColor
        + surfData.specularK * sTerm * lightData.lightColor) * surfData.baseColor.rgb;
}

@vertex fn vs_main(v: VertInput) -> VertOutput {
  var o: VertOutput;
  let wp4  = xformData.worldMat  * vec4<f32>(v.position, 1.0);
  let wn4  = xformData.normalMat * vec4<f32>(v.normal, 0.0);
  let wp   = wp4.xyz;
  let wn   = normalize(wn4.xyz);
  o.clipPos     = camData.projMat * camData.viewMat * wp4;
  o.worldPos    = wp;
  o.worldNormal = wn;
  o.texcoord    = v.texcoord;
  o.linearDepth = o.clipPos.z / o.clipPos.w;
  o.gouraudColor = select(vec3<f32>(0.0), computeBlinnPhong(wp, wn), surfData.shadingMode == 0u);
  return o;
}

@fragment fn fs_main(i: VertOutput) -> @location(0) vec4<f32> {
  let N = normalize(i.worldNormal);
  switch (surfData.shadingMode) {
    case 0u: { return vec4<f32>(i.gouraudColor, 1.0); }
    case 1u: { return vec4<f32>(computeBlinnPhong(i.worldPos, N), 1.0); }
    case 2u: { return vec4<f32>(N * 0.5 + 0.5, 1.0); }
    case 3u: { return vec4<f32>(computeBlinnPhong(i.worldPos, N), 1.0); }
    case 4u: {
      let d = clamp((i.linearDepth + 1.0) * 0.5, 0.0, 1.0);
      return vec4<f32>(d, d, d, 1.0);
    }
    case 5u: {
      let tc   = textureSample(albedoTex, texSampler, i.texcoord).rgb;
      let L    = normalize(lightData.lightPos - i.worldPos);
      let V    = normalize(camData.eyePos     - i.worldPos);
      let H    = normalize(L + V);
      let dT   = max(dot(N, L), 0.0);
      let sT   = pow(max(dot(N, H), 0.0), surfData.glossiness);
      let base = select(surfData.baseColor.rgb, tc, surfData.texEnabled == 1u);
      let lit  = (surfData.ambientK + surfData.diffuseK * dT) * base + surfData.specularK * sT * lightData.lightColor;
      return vec4<f32>(lit, 1.0);
    }
    case 6u: { return vec4<f32>(i.texcoord, 0.0, 1.0); }
    default: { return vec4<f32>(1.0, 0.0, 1.0, 1.0); }
  }
}

@vertex fn vs_edges(v: VertInput) -> VertOutput {
  var o: VertOutput;
  let wp4 = xformData.worldMat * vec4<f32>(v.position, 1.0);
  o.clipPos  = camData.projMat * camData.viewMat * wp4;
  o.clipPos.z -= 0.0002 * o.clipPos.w;
  o.worldPos     = wp4.xyz;
  o.worldNormal  = v.normal;
  o.texcoord     = v.texcoord;
  o.linearDepth  = 0.0;
  o.gouraudColor = vec3<f32>(1.0);
  return o;
}

@fragment fn fs_edges(i: VertOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(0.75, 0.85, 1.0, 1.0);
}
`,x={Gouraud:0,Phong:1,Normals:2,Wireframe:3,Depth:4,Texture:5,UVCoords:6},S=class{id=0;name=``;posX=0;posY=0;posZ=0;rotX=0;rotY=0;rotZ=0;sclX=1;sclY=1;sclZ=1;ka=.12;kd=.75;ks=.55;shininess=48;color=[.27,.57,.82];useTexture=!1;textureData=null;_triBuffer=null;_edgeBuffer=null;_triCount=0;_edgeCount=0;_gpuTex=null;_gpuTexView=null;boundCenter=[0,0,0];boundRadius=1},C=1;function w(e){let t=new S;return t.id=C++,t.name=e,t}var T=new class{gpu;ctx;swapFmt;cvs;solidPass;edgePass;bindLayout;camBuf;xformBuf;surfBuf;lightBuf;depthBuf;viewCam=new e;shadingMode=`Phong`;lightTint=[1,1,1];nodes=[];activeId=null;defaultSamp;blankTex;blankView;async init(e){this.cvs=e;let t=await navigator.gpu.requestAdapter();if(!t)throw Error(`No WebGPU adapter found.`);this.gpu=await t.requestDevice(),this.ctx=e.getContext(`webgpu`),this.swapFmt=navigator.gpu.getPreferredCanvasFormat(),this.ctx.configure({device:this.gpu,format:this.swapFmt,alphaMode:`opaque`}),this._initBuffers(),await this._initPipelines(),this._resetDepthBuffer(),this.defaultSamp=this.gpu.createSampler({magFilter:`linear`,minFilter:`linear`,mipmapFilter:`linear`,addressModeU:`repeat`,addressModeV:`repeat`}),this.blankTex=this.gpu.createTexture({size:[1,1,1],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.gpu.queue.writeTexture({texture:this.blankTex},new Uint8Array([255,255,255,255]),{bytesPerRow:4},{width:1,height:1}),this.blankView=this.blankTex.createView()}_initBuffers(){let e=this.gpu;this.camBuf=e.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.xformBuf=e.createBuffer({size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.surfBuf=e.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.lightBuf=e.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}async _initPipelines(){let e=this.gpu,t=e.createShaderModule({code:b});this.bindLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:2,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:3,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:5,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`}}]});let n=e.createPipelineLayout({bindGroupLayouts:[this.bindLayout]}),r=[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:`float32x3`},{shaderLocation:1,offset:12,format:`float32x3`},{shaderLocation:2,offset:24,format:`float32x2`}]}];this.solidPass=await e.createRenderPipelineAsync({layout:n,vertex:{module:t,entryPoint:`vs_main`,buffers:r},fragment:{module:t,entryPoint:`fs_main`,targets:[{format:this.swapFmt}]},primitive:{topology:`triangle-list`,cullMode:`back`},depthStencil:{format:`depth24plus`,depthWriteEnabled:!0,depthCompare:`less`}}),this.edgePass=await e.createRenderPipelineAsync({layout:n,vertex:{module:t,entryPoint:`vs_edges`,buffers:r},fragment:{module:t,entryPoint:`fs_edges`,targets:[{format:this.swapFmt}]},primitive:{topology:`line-list`},depthStencil:{format:`depth24plus`,depthWriteEnabled:!1,depthCompare:`less-equal`}})}_resetDepthBuffer(){this.depthBuf&&this.depthBuf.destroy(),this.depthBuf=this.gpu.createTexture({size:[this.cvs.width,this.cvs.height],format:`depth24plus`,usage:GPUTextureUsage.RENDER_ATTACHMENT})}_makeBindings(e){let t=e.useTexture&&e._gpuTexView?e._gpuTexView:this.blankView;return this.gpu.createBindGroup({layout:this.bindLayout,entries:[{binding:0,resource:{buffer:this.camBuf}},{binding:1,resource:{buffer:this.xformBuf}},{binding:2,resource:{buffer:this.surfBuf}},{binding:3,resource:{buffer:this.lightBuf}},{binding:4,resource:this.defaultSamp},{binding:5,resource:t}]})}_writeCamera(){let e=this.viewCam.computePosition(),t=i(e,this.viewCam.pivotPoint,[0,1,0]),n=r(Math.PI/4,this.cvs.width/this.cvs.height,this.viewCam.nearPlane(),this.viewCam.farPlane()),a=new Float32Array(36);a.set(t,0),a.set(n,16),a[32]=e[0],a[33]=e[1],a[34]=e[2],this.gpu.queue.writeBuffer(this.camBuf,0,a)}_writeTransform(e){let t=n(a(e.posX,e.posY,e.posZ),n(c(e.rotY*Math.PI/180),n(s(e.rotX*Math.PI/180),n(l(e.rotZ*Math.PI/180),o(e.sclX,e.sclY,e.sclZ))))),r=u(d(t)),i=new Float32Array(32);i.set(t,0),i.set(r,16),this.gpu.queue.writeBuffer(this.xformBuf,0,i)}_writeSurface(e){let t=new Float32Array(12);t[0]=e.color[0],t[1]=e.color[1],t[2]=e.color[2],t[3]=1,t[4]=e.ka,t[5]=e.kd,t[6]=e.ks,t[7]=e.shininess;let n=new DataView(t.buffer);n.setUint32(32,x[this.shadingMode]??1,!0),n.setUint32(36,e.useTexture&&e._gpuTexView?1:0,!0),this.gpu.queue.writeBuffer(this.surfBuf,0,t)}_writeLight(){let e=this.viewCam.computePosition(),t=new Float32Array(8);t[0]=e[0]+0,t[1]=e[1]+5,t[2]=e[2]+3,t[4]=this.lightTint[0],t[5]=this.lightTint[1],t[6]=this.lightTint[2],this.gpu.queue.writeBuffer(this.lightBuf,0,t)}async loadOBJ(e,t=`Model`,n=!0){let r=await _(e),i=w(t);return i.boundCenter=r.center,i.boundRadius=r.radius,this._uploadGeometry(i,r),this.nodes.push(i),n&&this.viewCam.fitToObject(r.center,r.radius),i}spawnSphere(e=1,t=!0){let n=v(e,32,32),r=w(`Sphere`);return r.boundCenter=n.center,r.boundRadius=n.radius,this._uploadGeometry(r,n),this.nodes.push(r),t&&this.viewCam.fitToObject(n.center,n.radius),r}spawnCube(e=1,t=!0){let n=y(e),r=w(`Cube`);return r.boundCenter=n.center,r.boundRadius=n.radius,this._uploadGeometry(r,n),this.nodes.push(r),t&&this.viewCam.fitToObject(n.center,n.radius),r}_uploadGeometry(e,t){let n=t.toInterleavedArray();e._triBuffer&&e._triBuffer.destroy(),e._triBuffer=this.gpu.createBuffer({size:n.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.gpu.queue.writeBuffer(e._triBuffer,0,n),e._triCount=n.length/8;let r=[],i=t.indices;for(let e=0;e<i.length;e+=3)for(let[n,a]of[[i[e],i[e+1]],[i[e+1],i[e+2]],[i[e+2],i[e]]]){let e=t.positions,i=t.normals,o=t.uvs;r.push(e[n*3],e[n*3+1],e[n*3+2],i[n*3],i[n*3+1],i[n*3+2],o[n*2],o[n*2+1],e[a*3],e[a*3+1],e[a*3+2],i[a*3],i[a*3+1],i[a*3+2],o[a*2],o[a*2+1])}let a=new Float32Array(r);e._edgeBuffer&&e._edgeBuffer.destroy(),e._edgeBuffer=this.gpu.createBuffer({size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.gpu.queue.writeBuffer(e._edgeBuffer,0,a),e._edgeCount=a.length/8}dropNode(e){let t=this.nodes.findIndex(t=>t.id===e);if(t<0)return;let n=this.nodes[t];n._triBuffer?.destroy(),n._edgeBuffer?.destroy(),n._gpuTex?.destroy(),this.nodes.splice(t,1)}async assignTexture(e,t){e._gpuTex?.destroy();let n=this.gpu.createTexture({size:[t.width,t.height,1],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.gpu.queue.copyExternalImageToTexture({source:t},{texture:n},[t.width,t.height]),e._gpuTex=n,e._gpuTexView=n.createView(),e.textureData=t}draw(){if(this.cvs.width<1||this.cvs.height<1)return;this._writeCamera(),this._writeLight();let e=this.gpu.createCommandEncoder(),t=this.ctx.getCurrentTexture().createView(),n=this.depthBuf.createView(),r=this.shadingMode===`Wireframe`,i=e.beginRenderPass({colorAttachments:[{view:t,clearValue:{r:.04,g:.05,b:.09,a:1},loadOp:`clear`,storeOp:`store`}],depthStencilAttachment:{view:n,depthClearValue:1,depthLoadOp:`clear`,depthStoreOp:`store`}});for(let e of this.nodes){if(!e._triBuffer||e._triCount===0)continue;this._writeTransform(e);let t=this._makeBindings(e);r?(this._writeSurface(e),i.setPipeline(this.solidPass),i.setBindGroup(0,t),i.setVertexBuffer(0,e._triBuffer),i.draw(e._triCount),e._edgeBuffer&&e._edgeCount>0&&(i.setPipeline(this.edgePass),i.setBindGroup(0,t),i.setVertexBuffer(0,e._edgeBuffer),i.draw(e._edgeCount))):(this._writeSurface(e),i.setPipeline(this.solidPass),i.setBindGroup(0,t),i.setVertexBuffer(0,e._triBuffer),i.draw(e._triCount))}i.end(),this.gpu.queue.submit([e.finish()])}},E=document.createElement(`canvas`);E.id=`renderCanvas`,document.body.appendChild(E);function D(){E.width=window.innerWidth,E.height=window.innerHeight,T.depthBuf&&T._resetDepthBuffer()}D(),window.addEventListener(`resize`,D);var O=!1,k=0,A=0;E.addEventListener(`mousedown`,e=>{O=!0,k=e.clientX,A=e.clientY,e.preventDefault()}),window.addEventListener(`mouseup`,()=>O=!1),window.addEventListener(`mousemove`,e=>{if(!O)return;let t=e.clientX-k,n=e.clientY-A;if(k=e.clientX,A=e.clientY,T.activeId!==null){let e=T.nodes.find(e=>e.id===T.activeId);e&&(e.rotY+=t*.5,e.rotX+=n*.5,L())}else T.viewCam.rotate(t,n)}),E.addEventListener(`wheel`,e=>{e.preventDefault(),T.viewCam.adjustZoom(e.deltaY*.05)},{passive:!1});var j=document.createElement(`div`);j.id=`overlay`,document.body.appendChild(j),j.innerHTML=`
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
`;var M={Gouraud:`Gouraud: lighting computed per vertex, interpolated.`,Phong:`Phong: normals interpolated per fragment, lighting per pixel.`,Normals:`Normals: world-space normal buffer as RGB.`,Wireframe:`Wireframe: edges only, hidden surface removed via depth.`,Depth:`Depth: depth buffer visualization.`,Texture:`Texture: spherical UV + Blinn-Phong lighting.`,UVCoords:`UV Coords: spherical texture coordinates as RG.`};document.querySelectorAll(`.mode-btn`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`.mode-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`);let t=e.dataset.mode;T.shadingMode=t,document.getElementById(`modeDesc`).textContent=M[t]??``})});function N(){let e=document.getElementById(`nodeList`);e.innerHTML=``,T.nodes.forEach((t,n)=>{let r=document.createElement(`div`);r.className=`scene-item`+(t.id===T.activeId?` selected`:``),r.textContent=`${n+1}. ${t.name}`,r.addEventListener(`click`,()=>{T.activeId=t.id,R()}),e.appendChild(r)})}var P=[{label:`Translate X`,key:`posX`,min:-200,max:200,step:.1},{label:`Translate Y`,key:`posY`,min:-200,max:200,step:.1},{label:`Translate Z`,key:`posZ`,min:-200,max:200,step:.1},{label:`Rotate X`,key:`rotX`,min:-180,max:180,step:.5},{label:`Rotate Y`,key:`rotY`,min:-180,max:180,step:.5},{label:`Rotate Z`,key:`rotZ`,min:-180,max:180,step:.5},{label:`Scale X`,key:`sclX`,min:.001,max:10,step:.001},{label:`Scale Y`,key:`sclY`,min:.001,max:10,step:.001},{label:`Scale Z`,key:`sclZ`,min:.001,max:10,step:.001}],F=[{label:`Ambient (Ka)`,key:`ka`,min:0,max:1,step:.01},{label:`Diffuse (Kd)`,key:`kd`,min:0,max:1,step:.01},{label:`Specular (Ks)`,key:`ks`,min:0,max:1,step:.01},{label:`Shininess (n)`,key:`shininess`,min:1,max:128,step:1}];function I(e,t){let n=document.getElementById(e);n.innerHTML=``;for(let e of t){let t=document.createElement(`div`);t.className=`slider-row`,t.innerHTML=`<span class="slider-lbl">${e.label}</span>
      <input type="range" min="${e.min}" max="${e.max}" step="${e.step}" data-key="${e.key}">
      <span class="slider-val" data-val="${e.key}">0</span>`,n.appendChild(t),t.querySelector(`input`).addEventListener(`input`,n=>{let r=z();if(!r)return;let i=parseFloat(n.target.value);r[e.key]=i,t.querySelector(`[data-val="${e.key}"]`).textContent=i.toFixed(3)})}if(e===`materialSliders`){let e=document.createElement(`div`);e.className=`color-row mat`,e.innerHTML=`<span>Object color</span><input type="color" id="nodeColorPicker" value="#4592d2">`,n.appendChild(e),document.getElementById(`nodeColorPicker`).addEventListener(`input`,e=>{let t=z();if(!t)return;let n=e.target.value;t.color=[parseInt(n.slice(1,3),16)/255,parseInt(n.slice(3,5),16)/255,parseInt(n.slice(5,7),16)/255]})}}I(`transformSliders`,P),I(`materialSliders`,F);function L(){let e=z(),t=document.getElementById(`selectionStatus`),n=document.getElementById(`nodeControls`);if(!e){t.textContent=`NO SELECTION — CAMERA ORBIT MODE`,t.style.display=`block`,n.style.display=`none`;return}t.style.display=`none`,n.style.display=`block`,[...P,...F].forEach(t=>{let n=document.querySelector(`input[data-key="${t.key}"]`),r=document.querySelector(`[data-val="${t.key}"]`);n&&r&&(n.value=String(e[t.key]),r.textContent=Number(e[t.key]).toFixed(3))});let r=document.getElementById(`nodeColorPicker`);if(r){let t=e=>Math.round(e*255).toString(16).padStart(2,`0`);r.value=`#${t(e.color[0])}${t(e.color[1])}${t(e.color[2])}`}let i=document.getElementById(`useTexToggle`);i&&(i.checked=e.useTexture)}function R(){N(),L()}function z(){return T.nodes.find(e=>e.id===T.activeId)??null}document.getElementById(`btnDeselect`).addEventListener(`click`,()=>{T.activeId=null,R()}),document.getElementById(`btnRemove`).addEventListener(`click`,()=>{T.activeId!==null&&(T.dropNode(T.activeId),T.activeId=null,R())}),document.getElementById(`btnSphere`).addEventListener(`click`,()=>{T.activeId=T.spawnSphere(1,!0).id,R()}),document.getElementById(`btnCube`).addEventListener(`click`,()=>{T.activeId=T.spawnCube(1,!0).id,R()}),document.getElementById(`btnTeapot`).addEventListener(`click`,async()=>{T.activeId=(await T.loadOBJ(`/teapot.obj`,`Teapot`,!0)).id,R()}),document.getElementById(`btnBeacon`).addEventListener(`click`,async()=>{T.activeId=(await T.loadOBJ(`/KAUST_Beacon.obj`,`KAUST_Beacon`,!0)).id,R()}),document.getElementById(`objFileInput`).addEventListener(`change`,async e=>{let t=e.target.files?.[0];if(!t)return;let n=URL.createObjectURL(t),r=t.name.replace(/\.obj$/i,``);T.activeId=(await T.loadOBJ(n,r,!0)).id,R(),e.target.value=``}),document.getElementById(`texFileInput`).addEventListener(`change`,async e=>{let t=e.target.files?.[0],n=z();if(!t||!n)return;let r=await createImageBitmap(t);await T.assignTexture(n,r),R()}),document.getElementById(`useTexToggle`).addEventListener(`change`,e=>{let t=z();t&&(t.useTexture=e.target.checked)}),document.getElementById(`lightColorPicker`).addEventListener(`input`,e=>{let t=e.target.value;T.lightTint=[parseInt(t.slice(1,3),16)/255,parseInt(t.slice(3,5),16)/255,parseInt(t.slice(5,7),16)/255]}),(async()=>{try{await T.init(E),R();function e(){T.draw(),requestAnimationFrame(e)}requestAnimationFrame(e)}catch(e){document.body.innerHTML=`<div style="color:#f99;font-family:monospace;padding:2em;font-size:1.1em">
      WebGPU error: ${e}<br><br>Requires Chrome 113+ with WebGPU enabled.</div>`}})();