export class ViewCamera {
  azimuth   = 0.3;
  elevation = 0.3;
  distance  = 8.0;
  pivotPoint: [number,number,number] = [0, 0, 0];

  rotate(deltaX: number, deltaY: number, speed = 0.005) {
    this.azimuth   += deltaX * speed;
    this.elevation  = Math.max(-Math.PI/2 + 0.01,
                      Math.min( Math.PI/2 - 0.01, this.elevation - deltaY * speed));
  }

  adjustZoom(amount: number) {
    this.distance = Math.max(0.5, this.distance + amount);
  }

  fitToObject(center: [number,number,number], radius: number, fov = Math.PI/4) {
    this.pivotPoint = [...center] as [number,number,number];
    this.distance   = (radius / Math.sin(fov / 2)) * 1.1;
  }

  computePosition(): [number,number,number] {
    const cosEl = Math.cos(this.elevation), sinEl = Math.sin(this.elevation);
    const cosAz = Math.cos(this.azimuth),   sinAz = Math.sin(this.azimuth);
    return [
      this.pivotPoint[0] + this.distance * cosEl * cosAz,
      this.pivotPoint[1] + this.distance * sinEl,
      this.pivotPoint[2] + this.distance * cosEl * sinAz,
    ];
  }

  nearPlane() { return Math.max(0.01, this.distance * 0.01); }
  farPlane()  { return this.distance * 10 + 100; }
}
