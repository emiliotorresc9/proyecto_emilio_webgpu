// Vertex layout per entry in flat buffer: px py pz  nx ny nz  u v  (8 floats)

export class GeometryData {
  positions   : Float32Array;
  normals     : Float32Array;
  uvs         : Float32Array;
  indices     : Uint32Array;
  vertexCount : number;
  faceCount   : number;

  bboxMin : [number,number,number] = [0,0,0];
  bboxMax : [number,number,number] = [0,0,0];
  center  : [number,number,number] = [0,0,0];
  radius  : number = 1;

  constructor(
    positions: Float32Array,
    normals:   Float32Array,
    uvs:       Float32Array,
    indices:   Uint32Array,
  ) {
    this.positions   = positions;
    this.normals     = normals;
    this.uvs         = uvs;
    this.indices     = indices;
    this.vertexCount = positions.length / 3;
    this.faceCount   = indices.length   / 3;
    this._computeBounds();
  }

  _computeBounds() {
    let minX=Infinity,minY=Infinity,minZ=Infinity;
    let maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    for (let i=0; i<this.positions.length; i+=3) {
      const x=this.positions[i], y=this.positions[i+1], z=this.positions[i+2];
      if(x<minX)minX=x; if(x>maxX)maxX=x;
      if(y<minY)minY=y; if(y>maxY)maxY=y;
      if(z<minZ)minZ=z; if(z>maxZ)maxZ=z;
    }
    this.bboxMin = [minX,minY,minZ];
    this.bboxMax = [maxX,maxY,maxZ];
    this.center  = [(minX+maxX)/2,(minY+maxY)/2,(minZ+maxZ)/2];
    const dx=maxX-minX, dy=maxY-minY, dz=maxZ-minZ;
    this.radius = Math.hypot(dx,dy,dz) / 2;
  }

  // Expand indexed geometry into a flat triangle-list buffer for the GPU
  toFlatBuffer(): Float32Array {
    const data = new Float32Array(this.indices.length * 8);
    for (let i=0; i<this.indices.length; i++) {
      const vi   = this.indices[i];
      const base = i * 8;
      data[base+0] = this.positions[vi*3+0];
      data[base+1] = this.positions[vi*3+1];
      data[base+2] = this.positions[vi*3+2];
      data[base+3] = this.normals[vi*3+0];
      data[base+4] = this.normals[vi*3+1];
      data[base+5] = this.normals[vi*3+2];
      data[base+6] = this.uvs[vi*2+0];
      data[base+7] = this.uvs[vi*2+1];
    }
    return data;
  }
}

// Parse an OBJ file and return a GeometryData with per-vertex normals and spherical UVs
export async function parseOBJFile(url: string): Promise<GeometryData> {
  const text = await fetch(url).then(r => r.text());

  const rawPos  : number[][] = [];
  const rawUV   : number[][] = [];
  const rawNorm : number[][] = [];

  const keyToIdx  = new Map<string, number>();
  const positions : number[] = [];
  const uvs       : number[] = [];
  const normsBuf  : number[] = [];
  const indices   : number[] = [];

  for (const line of text.split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p[0] === 'v')  rawPos .push([+p[1], +p[2], +p[3]]);
    if (p[0] === 'vt') rawUV  .push([+p[1], 1 - +p[2]]);
    if (p[0] === 'vn') rawNorm.push([+p[1], +p[2], +p[3]]);
    if (p[0] === 'f') {
      const faceVerts = p.slice(1).map(s => {
        const [vi, ti, ni] = s.split('/').map(x => x ? +x - 1 : -1);
        return { vi, ti, ni };
      });
      // Fan triangulation for quads/polygons
      for (let i = 1; i < faceVerts.length - 1; i++) {
        for (const w of [faceVerts[0], faceVerts[i], faceVerts[i+1]]) {
          const key = `${w.vi}/${w.ti}/${w.ni}`;
          if (!keyToIdx.has(key)) {
            const idx = positions.length / 3;
            keyToIdx.set(key, idx);
            const pos = rawPos[w.vi] ?? [0,0,0];
            positions.push(pos[0], pos[1], pos[2]);
            const uv = w.ti >= 0 ? rawUV[w.ti] : [0, 0];
            uvs.push(uv[0], uv[1]);
            const n = w.ni >= 0 ? rawNorm[w.ni] : [0,0,0];
            normsBuf.push(n[0], n[1], n[2]);
          }
          indices.push(keyToIdx.get(key)!);
        }
      }
    }
  }

  const posArr = new Float32Array(positions);
  const idxArr = new Uint32Array(indices);

  // Centrar vértices en el origen usando el centro del bounding box
  let minX=Infinity,minY=Infinity,minZ=Infinity;
  let maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for (let i=0; i<posArr.length; i+=3) {
    if(posArr[i]  <minX)minX=posArr[i];   if(posArr[i]  >maxX)maxX=posArr[i];
    if(posArr[i+1]<minY)minY=posArr[i+1]; if(posArr[i+1]>maxY)maxY=posArr[i+1];
    if(posArr[i+2]<minZ)minZ=posArr[i+2]; if(posArr[i+2]>maxZ)maxZ=posArr[i+2];
  }
  const ocx=(minX+maxX)/2, ocy=(minY+maxY)/2, ocz=(minZ+maxZ)/2;
  for (let i=0; i<posArr.length; i+=3) {
    posArr[i]  -= ocx;
    posArr[i+1]-= ocy;
    posArr[i+2]-= ocz;
  }

  // Normalizar a radio unitario: calcular el radio máximo y escalar todos los vértices
  let maxR = 0;
  for (let i=0; i<posArr.length; i+=3) {
    const r = Math.hypot(posArr[i], posArr[i+1], posArr[i+2]);
    if (r > maxR) maxR = r;
  }
  if (maxR > 0) {
    for (let i=0; i<posArr.length; i++) posArr[i] /= maxR;
  }

  // Accumulate per-face normals into vertex normals (area-weighted)
  const vertNormals = new Float32Array(positions.length);
  for (let f = 0; f < idxArr.length; f += 3) {
    const ia = idxArr[f], ib = idxArr[f+1], ic = idxArr[f+2];
    const ax=posArr[ia*3],ay=posArr[ia*3+1],az=posArr[ia*3+2];
    const bx=posArr[ib*3],by=posArr[ib*3+1],bz=posArr[ib*3+2];
    const cx=posArr[ic*3],cy=posArr[ic*3+1],cz=posArr[ic*3+2];
    const ux=bx-ax, uy=by-ay, uz=bz-az;
    const vx=cx-ax, vy=cy-ay, vz=cz-az;
    const nx = uy*vz - uz*vy;
    const ny = uz*vx - ux*vz;
    const nz = ux*vy - uy*vx;
    for (const iv of [ia, ib, ic]) {
      vertNormals[iv*3+0] += nx;
      vertNormals[iv*3+1] += ny;
      vertNormals[iv*3+2] += nz;
    }
  }
  for (let i = 0; i < vertNormals.length; i += 3) {
    const l = Math.hypot(vertNormals[i], vertNormals[i+1], vertNormals[i+2]) || 1;
    vertNormals[i]   /= l;
    vertNormals[i+1] /= l;
    vertNormals[i+2] /= l;
  }

  // Spherical UV parameterization
  let cx2=0, cy2=0, cz2=0;
  const vc = posArr.length / 3;
  for (let i=0; i<posArr.length; i+=3){ cx2+=posArr[i]; cy2+=posArr[i+1]; cz2+=posArr[i+2]; }
  cx2/=vc; cy2/=vc; cz2/=vc;

  const uvArr = new Float32Array(vc * 2);
  for (let i=0; i<vc; i++) {
    const dx = posArr[i*3]   - cx2;
    const dy = posArr[i*3+1] - cy2;
    const dz = posArr[i*3+2] - cz2;
    const l  = Math.hypot(dx, dy, dz) || 1;
    uvArr[i*2]   = 0.5 + Math.atan2(dz/l, dx/l) / (2 * Math.PI);
    uvArr[i*2+1] = 0.5 - Math.asin(Math.max(-1, Math.min(1, dy/l))) / Math.PI;
  }

  return new GeometryData(posArr, vertNormals, uvArr, idxArr);
}

export function buildSphereGeometry(radius = 1, stacks = 32, slices = 32): GeometryData {
  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];
  const indices:   number[] = [];

  for (let i = 0; i <= stacks; i++) {
    const phi  = (i / stacks) * Math.PI;
    const sinP = Math.sin(phi), cosP = Math.cos(phi);
    for (let j = 0; j <= slices; j++) {
      const theta = (j / slices) * 2 * Math.PI;
      const sinT  = Math.sin(theta), cosT = Math.cos(theta);
      const nx = sinP * cosT, ny = cosP, nz = sinP * sinT;
      positions.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / slices, i / stacks);
    }
  }
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * (slices + 1) + j;
      const b = a + slices + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return new GeometryData(
    new Float32Array(positions), new Float32Array(normals),
    new Float32Array(uvs),       new Uint32Array(indices),
  );
}

export function buildCubeGeometry(size = 1): GeometryData {
  const h = size / 2;
  type FaceVert = { pos:[number,number,number], n:[number,number,number], uv:[number,number] };
  const faces: FaceVert[][] = [
    [{pos:[h,-h,-h],n:[1,0,0],uv:[0,1]},{pos:[h, h,-h],n:[1,0,0],uv:[0,0]},{pos:[h, h, h],n:[1,0,0],uv:[1,0]},{pos:[h,-h, h],n:[1,0,0],uv:[1,1]}],
    [{pos:[-h,-h, h],n:[-1,0,0],uv:[0,1]},{pos:[-h, h, h],n:[-1,0,0],uv:[0,0]},{pos:[-h, h,-h],n:[-1,0,0],uv:[1,0]},{pos:[-h,-h,-h],n:[-1,0,0],uv:[1,1]}],
    [{pos:[-h, h,-h],n:[0,1,0],uv:[0,1]},{pos:[-h, h, h],n:[0,1,0],uv:[0,0]},{pos:[h, h, h],n:[0,1,0],uv:[1,0]},{pos:[h, h,-h],n:[0,1,0],uv:[1,1]}],
    [{pos:[-h,-h, h],n:[0,-1,0],uv:[0,1]},{pos:[-h,-h,-h],n:[0,-1,0],uv:[0,0]},{pos:[h,-h,-h],n:[0,-1,0],uv:[1,0]},{pos:[h,-h, h],n:[0,-1,0],uv:[1,1]}],
    [{pos:[-h,-h, h],n:[0,0,1],uv:[0,1]},{pos:[h,-h, h],n:[0,0,1],uv:[1,1]},{pos:[h, h, h],n:[0,0,1],uv:[1,0]},{pos:[-h, h, h],n:[0,0,1],uv:[0,0]}],
    [{pos:[h,-h,-h],n:[0,0,-1],uv:[1,1]},{pos:[-h,-h,-h],n:[0,0,-1],uv:[0,1]},{pos:[-h, h,-h],n:[0,0,-1],uv:[0,0]},{pos:[h, h,-h],n:[0,0,-1],uv:[1,0]}],
  ];

  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];
  const indices:   number[] = [];

  for (const face of faces) {
    const base = positions.length / 3;
    for (const v of face) {
      positions.push(...v.pos);
      normals.push(...v.n);
      uvs.push(...v.uv);
    }
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }
  return new GeometryData(
    new Float32Array(positions), new Float32Array(normals),
    new Float32Array(uvs),       new Uint32Array(indices),
  );
}
