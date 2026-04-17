// Legacy single-pass OBJ loader (kept for compatibility)
export async function loadOBJ(url: string) {
  const text = await fetch(url).then(r => r.text());

  const verts: number[][] = [];
  const out:   number[]   = [];

  for (const line of text.split('\n')) {
    const tok = line.trim().split(/\s+/);

    if (tok[0] === 'v') {
      verts.push([parseFloat(tok[1]), parseFloat(tok[2]), parseFloat(tok[3])]);
    }

    if (tok[0] === 'f') {
      const idxs = tok.slice(1).map(p => parseInt(p) - 1);
      const a = verts[idxs[0]];
      const b = verts[idxs[1]];
      const c = verts[idxs[2]];

      // Edge vectors
      const ux = b[0]-a[0], uy = b[1]-a[1], uz = b[2]-a[2];
      const vx = c[0]-a[0], vy = c[1]-a[1], vz = c[2]-a[2];

      // Face normal via cross product
      let nx = uy*vz - uz*vy;
      let ny = uz*vx - ux*vz;
      let nz = ux*vy - uy*vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx/=len; ny/=len; nz/=len;

      for (const v of [a, b, c]) {
        out.push(v[0], v[1], v[2], nx, ny, nz);
      }
    }
  }

  return new Float32Array(out);
}
