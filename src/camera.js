export class ViewCamera {
    constructor() {
        this.azimuth = 0.3;
        this.elevation = 0.3;
        this.distance = 8.0;
        this.pivotPoint = [0, 0, 0];
    }
    rotate(deltaX, deltaY, speed = 0.005) {
        this.azimuth += deltaX * speed;
        this.elevation = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.elevation - deltaY * speed));
    }
    adjustZoom(amount) {
        this.distance = Math.max(0.5, this.distance + amount);
    }
    fitToObject(center, radius, fov = Math.PI / 4) {
        this.pivotPoint = [...center];
        this.distance = (radius / Math.sin(fov / 2)) * 1.1;
    }
    computePosition() {
        const cosEl = Math.cos(this.elevation), sinEl = Math.sin(this.elevation);
        const cosAz = Math.cos(this.azimuth), sinAz = Math.sin(this.azimuth);
        return [
            this.pivotPoint[0] + this.distance * cosEl * cosAz,
            this.pivotPoint[1] + this.distance * sinEl,
            this.pivotPoint[2] + this.distance * cosEl * sinAz,
        ];
    }
    nearPlane() { return Math.max(0.01, this.distance * 0.01); }
    farPlane() { return this.distance * 10 + 100; }
}
