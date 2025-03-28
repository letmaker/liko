export interface IPoint {
  x: number;
  y: number;
}

/**
 * 坐标点
 */
export class Point {
  /** 全局临时对象，方便复用，以减少对象创建 */
  static readonly TEMP = new Point();

  /** x 坐标点 */
  x = 0;
  /** y 坐标点 */
  y = 0;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置坐标点
   * @param x x 坐标点
   * @param y y 坐标点，不设置则等于 x
   */
  set(x = 0, y: number = x): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * 重置为 0,0
   */
  reset() {
    this.x = 0;
    this.y = 0;
  }

  /**
   * 比较两个坐标点是否相同
   * @param point 给定的坐标点
   * @returns 是否相同
   */
  equals(point: IPoint): boolean {
    return point.x === this.x && point.y === this.y;
  }

  /**
   * 返回当前点和目标点的夹角，单位为弧度
   * @param point 目标点
   * @returns 返回夹角信息，单位为弧度
   */
  radian(point: IPoint): number {
    return Math.atan2(point.y - this.y, point.x - this.x);
  }

  /**
   * 计算两点的距离
   * @param point 给定点位
   * @returns 距离长度
   */
  distance(point: IPoint): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 添加增量值
   * @param dx  x 增量
   * @param dy  y 增量
   */
  add(dx: number, dy: number): this {
    this.x += dx;
    this.y += dy;
    return this;
  }

  /**
   * 向量归一化
   */
  normalize(): this {
    const length = Math.sqrt(this.x * this.x + this.y * this.y);
    this.x = this.x / length;
    this.y = this.y / length;
    return this;
  }

  /**
   * 把指定的坐标点 copy 到当前坐标
   * @param point 指定的坐标点
   */
  copyFrom(point: IPoint): this {
    this.set(point.x, point.y);
    return this;
  }

  /**
   * clone 当前坐标点，返回新的坐标对象
   */
  clone(): Point {
    return new Point(this.x, this.y);
  }
}
