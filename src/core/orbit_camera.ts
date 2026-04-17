export class OrbitCamera {
  yaw    = 0.3;
  pitch  = 0.3;
  radius = 8.0;
  target: [number,number,number] = [0, 0, 0];

  // Update yaw/pitch from mouse delta
  orbit(dx: number, dy: number, sensitivity = 0.005) {
    this.yaw  += dx * sensitivity;
    this.pitch = Math.max(-Math.PI/2 + 0.01,
                 Math.min( Math.PI/2 - 0.01, this.pitch - dy * sensitivity));
  }

  zoom(delta: number) {
    this.radius = Math.max(0.5, this.radius + delta);
  }

  // Fit camera so the given bounding sphere fills the view
  fitToObject(center: [number,number,number], boundingRadius: number, fovY = Math.PI/4) {
    this.target = [...center] as [number,number,number];
    this.radius = (boundingRadius / Math.sin(fovY / 2)) * 1.1;
  }

  getEyePosition(): [number,number,number] {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const cy = Math.cos(this.yaw),   sy = Math.sin(this.yaw);
    return [
      this.target[0] + this.radius * cp * cy,
      this.target[1] + this.radius * sp,
      this.target[2] + this.radius * cp * sy,
    ];
  }

  // Near/far derived from radius to avoid clipping
  getNearPlane() { return Math.max(0.01, this.radius * 0.01); }
  getFarPlane()  { return this.radius * 10 + 100; }
}
