struct CameraUniforms {
  view     : mat4x4<f32>,
  proj     : mat4x4<f32>,
  position : vec3<f32>,
  _pad     : f32,
}
struct ModelUniforms {
  modelMat  : mat4x4<f32>,
  normalMat : mat4x4<f32>,
}
struct SurfaceProps {
  color     : vec4<f32>,
  ka        : f32,
  kd        : f32,
  ks        : f32,
  shininess : f32,
  shadeMode : u32,
  useTex    : u32,
  _p0       : f32,
  _p1       : f32,
}
struct LightUniforms {
  position : vec3<f32>,
  _p0      : f32,
  color    : vec3<f32>,
  _p1      : f32,
}

@group(0) @binding(0) var<uniform> cam        : CameraUniforms;
@group(0) @binding(1) var<uniform> mdl        : ModelUniforms;
@group(0) @binding(2) var<uniform> surf       : SurfaceProps;
@group(0) @binding(3) var<uniform> lit        : LightUniforms;
@group(0) @binding(4) var          texSampler : sampler;
@group(0) @binding(5) var          texAlbedo  : texture_2d<f32>;

struct VertIn {
  @location(0) pos : vec3<f32>,
  @location(1) nor : vec3<f32>,
  @location(2) uv  : vec2<f32>,
}
struct VertOut {
  @builtin(position) clip : vec4<f32>,
  @location(0) worldPos   : vec3<f32>,
  @location(1) worldNor   : vec3<f32>,
  @location(2) uv         : vec2<f32>,
  @location(3) gouraudCol : vec3<f32>,
  @location(4) ndcDepth   : f32,
}

fn evalBlinnPhong(wpos: vec3<f32>, N: vec3<f32>) -> vec3<f32> {
  let L    = normalize(lit.position - wpos);
  let V    = normalize(cam.position  - wpos);
  let H    = normalize(L + V);
  let diff = max(dot(N, L), 0.0);
  let spec = pow(max(dot(N, H), 0.0), surf.shininess);
  return (surf.ka * lit.color
        + surf.kd * diff * lit.color
        + surf.ks * spec * lit.color) * surf.color.rgb;
}

@vertex fn vs_main(v: VertIn) -> VertOut {
  var o: VertOut;
  let wp4 = mdl.modelMat  * vec4<f32>(v.pos, 1.0);
  let wn4 = mdl.normalMat * vec4<f32>(v.nor, 0.0);
  let wp  = wp4.xyz;
  let wn  = normalize(wn4.xyz);
  o.clip       = cam.proj * cam.view * wp4;
  o.worldPos   = wp;
  o.worldNor   = wn;
  o.uv         = v.uv;
  o.ndcDepth   = o.clip.z / o.clip.w;
  o.gouraudCol = select(vec3<f32>(0.0), evalBlinnPhong(wp, wn), surf.shadeMode == 0u);
  return o;
}

@fragment fn fs_main(i: VertOut) -> @location(0) vec4<f32> {
  let N = normalize(i.worldNor);
  switch (surf.shadeMode) {
    case 0u: { return vec4<f32>(i.gouraudCol, 1.0); }
    case 1u: { return vec4<f32>(evalBlinnPhong(i.worldPos, N), 1.0); }
    case 2u: { return vec4<f32>(N * 0.5 + 0.5, 1.0); }
    case 3u: { return vec4<f32>(evalBlinnPhong(i.worldPos, N), 1.0); }
    case 4u: {
      let d = clamp((i.ndcDepth + 1.0) * 0.5, 0.0, 1.0);
      return vec4<f32>(d, d, d, 1.0);
    }
    case 5u: {
      let tc    = textureSample(texAlbedo, texSampler, i.uv).rgb;
      let L     = normalize(lit.position - i.worldPos);
      let V     = normalize(cam.position  - i.worldPos);
      let H     = normalize(L + V);
      let diff  = max(dot(N, L), 0.0);
      let spec  = pow(max(dot(N, H), 0.0), surf.shininess);
      let base   = select(surf.color.rgb, tc, surf.useTex == 1u);
      let result = (surf.ka + surf.kd * diff) * base + surf.ks * spec * lit.color;
      return vec4<f32>(result, 1.0);
    }
    case 6u: { return vec4<f32>(i.uv, 0.0, 1.0); }
    default: { return vec4<f32>(1.0, 0.0, 1.0, 1.0); }
  }
}

@vertex fn vs_wire(v: VertIn) -> VertOut {
  var o: VertOut;
  let wp4   = mdl.modelMat * vec4<f32>(v.pos, 1.0);
  o.clip    = cam.proj * cam.view * wp4;
  o.clip.z -= 0.0002 * o.clip.w;
  o.worldPos   = wp4.xyz;
  o.worldNor   = v.nor;
  o.uv         = v.uv;
  o.ndcDepth   = 0.0;
  o.gouraudCol = vec3<f32>(1.0);
  return o;
}

@fragment fn fs_wire(i: VertOut) -> @location(0) vec4<f32> {
  return vec4<f32>(0.9, 0.95, 1.0, 1.0);
}
