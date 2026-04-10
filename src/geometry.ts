export class GeometryBuffer {
  positions   : Float32Array;
  normals     : Float32Array;
  uvs         : Float32Array;
  indices     : Uint32Array;
  vertexCount : number;
  faceCount   : number;

  boundsMin   : [number,number,number] = [0,0,0];
  boundsMax   : [number,number,number] = [0,0,0];
  center      : [number,number,number] = [0,0,0];
  radius      : number = 1;

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
    this._calcBounds();
  }

  _calcBounds() {
    let x0=Infinity,y0=Infinity,z0=Infinity;
    let x1=-Infinity,y1=-Infinity,z1=-Infinity;
    for (let i=0; i<this.positions.length; i+=3) {
      const x=this.positions[i], y=this.positions[i+1], z=this.positions[i+2];
      if(x<x0)x0=x; if(x>x1)x1=x;
      if(y<y0)y0=y; if(y>y1)y1=y;
      if(z<z0)z0=z; if(z>z1)z1=z;
    }
    this.boundsMin = [x0,y0,z0];
    this.boundsMax = [x1,y1,z1];
    this.center    = [(x0+x1)/2,(y0+y1)/2,(z0+z1)/2];
    this.radius    = Math.hypot(x1-x0, y1-y0, z1-z0) / 2;
  }

  toInterleavedArray(): Float32Array {
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

export async function parseOBJFile(url: string): Promise<GeometryBuffer> {
  const text = await fetch(url).then(r => r.text());

  const rawPositions : number[][] = [];
  const rawTexCoords : number[][] = [];
  const rawNormals   : number[][] = [];

  const vertexMap  = new Map<string, number>();
  const positions  : number[] = [];
  const texCoords  : number[] = [];
  const normalsOBJ : number[] = [];
  const indices    : number[] = [];

  for (const line of text.split('\n')) {
    const tokens = line.trim().split(/\s+/);
    if (tokens[0] === 'v')  rawPositions.push([+tokens[1], +tokens[2], +tokens[3]]);
    if (tokens[0] === 'vt') rawTexCoords.push([+tokens[1], 1 - +tokens[2]]);
    if (tokens[0] === 'vn') rawNormals  .push([+tokens[1], +tokens[2], +tokens[3]]);
    if (tokens[0] === 'f') {
      const faceVerts = tokens.slice(1).map(s => {
        const [pi, ti, ni] = s.split('/').map(x => x ? +x - 1 : -1);
        return { pi, ti, ni };
      });
      for (let i = 1; i < faceVerts.length - 1; i++) {
        for (const w of [faceVerts[0], faceVerts[i], faceVerts[i+1]]) {
          const key = `${w.pi}/${w.ti}/${w.ni}`;
          if (!vertexMap.has(key)) {
            const idx = positions.length / 3;
            vertexMap.set(key, idx);
            const pos = rawPositions[w.pi] ?? [0,0,0];
            positions.push(pos[0], pos[1], pos[2]);
            const uv = w.ti >= 0 ? rawTexCoords[w.ti] : [0, 0];
            texCoords.push(uv[0], uv[1]);
            const n = w.ni >= 0 ? rawNormals[w.ni] : [0,0,0];
            normalsOBJ.push(n[0], n[1], n[2]);
          }
          indices.push(vertexMap.get(key)!);
        }
      }
    }
  }

  const posArr = new Float32Array(positions);
  const idxArr = new Uint32Array(indices);

  const accNormals = new Float32Array(positions.length);

  for (let f = 0; f < idxArr.length; f += 3) {
    const ia = idxArr[f], ib = idxArr[f+1], ic = idxArr[f+2];
    const ax=posArr[ia*3],ay=posArr[ia*3+1],az=posArr[ia*3+2];
    const bx=posArr[ib*3],by=posArr[ib*3+1],bz=posArr[ib*3+2];
    const cx=posArr[ic*3],cy=posArr[ic*3+1],cz=posArr[ic*3+2];

    const ux=bx-ax, uy=by-ay, uz=bz-az;
    const vx=cx-ax, vy=cy-ay, vz=cz-az;

    const fnx = uy*vz - uz*vy;
    const fny = uz*vx - ux*vz;
    const fnz = ux*vy - uy*vx;

    for (const iv of [ia, ib, ic]) {
      accNormals[iv*3+0] += fnx;
      accNormals[iv*3+1] += fny;
      accNormals[iv*3+2] += fnz;
    }
  }

  for (let i = 0; i < accNormals.length; i += 3) {
    const len = Math.hypot(accNormals[i], accNormals[i+1], accNormals[i+2]) || 1;
    accNormals[i]   /= len;
    accNormals[i+1] /= len;
    accNormals[i+2] /= len;
  }

  let cx=0, cy=0, cz=0;
  const vc = posArr.length / 3;
  for (let i=0; i<posArr.length; i+=3){ cx+=posArr[i]; cy+=posArr[i+1]; cz+=posArr[i+2]; }
  cx/=vc; cy/=vc; cz/=vc;

  const uvArr = new Float32Array(vc * 2);
  for (let i=0; i<vc; i++) {
    const dx = posArr[i*3]   - cx;
    const dy = posArr[i*3+1] - cy;
    const dz = posArr[i*3+2] - cz;
    const len  = Math.hypot(dx, dy, dz) || 1;
    uvArr[i*2]   = 0.5 + Math.atan2(dz/len, dx/len) / (2 * Math.PI);
    uvArr[i*2+1] = 0.5 - Math.asin(Math.max(-1, Math.min(1, dy/len))) / Math.PI;
  }

  return new GeometryBuffer(posArr, accNormals, uvArr, idxArr);
}

export function buildSphereMesh(radius = 1, rows = 32, cols = 32): GeometryBuffer {
  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];
  const indices:   number[] = [];

  for (let i = 0; i <= rows; i++) {
    const phi = (i / rows) * Math.PI;
    const sp = Math.sin(phi), cp = Math.cos(phi);
    for (let j = 0; j <= cols; j++) {
      const theta = (j / cols) * 2 * Math.PI;
      const st = Math.sin(theta), ct = Math.cos(theta);
      const nx = sp * ct, ny = cp, nz = sp * st;
      positions.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / cols, i / rows);
    }
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j;
      const b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return new GeometryBuffer(
    new Float32Array(positions),
    new Float32Array(normals),
    new Float32Array(uvs),
    new Uint32Array(indices),
  );
}

export function buildCubeMesh(size = 1): GeometryBuffer {
  const h = size / 2;
  const faces: Array<{ pos: [number,number,number], n: [number,number,number], uv: [number,number] }>[] = [
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

  return new GeometryBuffer(
    new Float32Array(positions),
    new Float32Array(normals),
    new Float32Array(uvs),
    new Uint32Array(indices),
  );
}
