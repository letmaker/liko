/**
 * 单个粒子的数据结构
 * 存储粒子在某个时刻的所有状态信息
 *
 * 优化版本：使用紧凑的数据布局，减少对象属性访问开销
 */
export class ParticleData {
  // 位置 (2 floats)
  x = 0;
  y = 0;

  // 速度 (2 floats)
  vx = 0;
  vy = 0;

  // 重力 (2 floats)
  gx = 0;
  gy = 0;

  // 加速度 (2 floats)
  radialAccel = 0;
  tangentialAccel = 0;

  // 旋转相关 (3 floats)
  rotation = 0;
  rotationDelta = 0;

  // 大小相关 (2 floats)
  size = 0;
  sizeDelta = 0;

  // 颜色RGBA + 增量 (8 floats)
  r = 1;
  g = 1;
  b = 1;
  a = 1;
  dr = 0;
  dg = 0;
  db = 0;
  da = 0;

  // 生命周期 (2 floats)
  timeToLive = 0;
  totalTimeToLive = 0;

  // 径向模式特有属性 (4 floats)
  angle = 0;
  angleDelta = 0;
  radius = 0;
  radiusDelta = 0;

  // 总计: 32 个float = 128 bytes（相比原来减少了对象嵌套开销）

  /**
   * 重置粒子数据到初始状态
   */
  reset(): void {
    this.x = this.y = 0;
    this.vx = this.vy = 0;
    this.gx = this.gy = 0;
    this.radialAccel = this.tangentialAccel = 0;
    this.rotation = this.rotationDelta = 0;
    this.size = this.sizeDelta = 0;
    this.r = this.g = this.b = this.a = 1;
    this.dr = this.dg = this.db = this.da = 0;
    this.timeToLive = this.totalTimeToLive = 0;
    this.angle = this.angleDelta = 0;
    this.radius = this.radiusDelta = 0;
  }

  /**
   * 获取生命周期百分比 (0-1)
   */
  get lifePercent(): number {
    return this.totalTimeToLive > 0 ? 1 - this.timeToLive / this.totalTimeToLive : 0;
  }

  /**
   * 检查粒子是否还活着
   */
  get isAlive(): boolean {
    return this.timeToLive > 0;
  }

  // 为了兼容现有代码，保留旧的属性访问器
  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  set position(value: { x: number; y: number }) {
    this.x = value.x;
    this.y = value.y;
  }

  get velocity(): { x: number; y: number } {
    return { x: this.vx, y: this.vy };
  }

  set velocity(value: { x: number; y: number }) {
    this.vx = value.x;
    this.vy = value.y;
  }

  get gravity(): { x: number; y: number } {
    return { x: this.gx, y: this.gy };
  }

  set gravity(value: { x: number; y: number }) {
    this.gx = value.x;
    this.gy = value.y;
  }

  get radialAcceleration(): number {
    return this.radialAccel;
  }

  set radialAcceleration(value: number) {
    this.radialAccel = value;
  }

  get tangentialAcceleration(): number {
    return this.tangentialAccel;
  }

  set tangentialAcceleration(value: number) {
    this.tangentialAccel = value;
  }

  get color(): { r: number; g: number; b: number; a: number } {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  set color(value: { r: number; g: number; b: number; a: number }) {
    this.r = value.r;
    this.g = value.g;
    this.b = value.b;
    this.a = value.a;
  }

  get colorDelta(): { r: number; g: number; b: number; a: number } {
    return { r: this.dr, g: this.dg, b: this.db, a: this.da };
  }

  set colorDelta(value: { r: number; g: number; b: number; a: number }) {
    this.dr = value.r;
    this.dg = value.g;
    this.db = value.b;
    this.da = value.a;
  }
}
