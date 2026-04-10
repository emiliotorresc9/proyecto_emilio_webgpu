struct CameraUniforms {
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
