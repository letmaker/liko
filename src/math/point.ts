/** 点坐标接口 */
export interface IPoint {
  /** x 轴坐标值 */
  x: number;
  /** y 轴坐标值 */
  y: number;
}

/**
 * 二维坐标点类
 */
export class Point {
  /** 全局临时对象，用于复用以减少对象创建开销 */
  static readonly TEMP = new Point();

  /** x 轴坐标值 */
  x = 0;
  /** y 轴坐标值 */
  y = 0;

  /**
   * 创建一个新的坐标点实例
   * @param x - x 轴坐标值
   * @param y - y 轴坐标值
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置坐标点的位置
   * @param x - x 轴坐标值
   * @param y - y 轴坐标值，不设置则等于 x
   * @returns 当前实例，支持链式调用
   */
  set(x = 0, y: number = x): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * 重置坐标点为原点 (0, 0)
   */
  reset(): void {
    this.x = 0;
    this.y = 0;
  }

  /**
   * 比较当前坐标点与给定坐标点是否相同
   * @param point - 待比较的坐标点
   * @returns 两点是否完全重合
   */
  equals(point: IPoint): boolean {
    return point.x === this.x && point.y === this.y;
  }

  /**
   * 计算当前点到目标点的夹角
   * @param point - 目标点坐标
   * @returns 两点间的夹角（单位：弧度）
   */
  radian(point: IPoint): number {
    return Math.atan2(point.y - this.y, point.x - this.x);
  }

  /**
   * 计算当前点到目标点的距离
   * @param point - 目标点坐标
   * @returns 两点间的直线距离
   */
  distance(point: IPoint): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 将坐标点按指定增量进行偏移
   * @param dx - x 轴偏移量
   * @param dy - y 轴偏移量
   * @returns 当前实例，支持链式调用
   */
  add(dx: number, dy: number): this {
    this.x += dx;
    this.y += dy;
    return this;
  }

  /**
   * 将当前点作为向量进行归一化处理
   * @returns 当前实例，支持链式调用
   */
  normalize(): this {
    const length = Math.sqrt(this.x * this.x + this.y * this.y);
    if (length !== 0) {
      this.x = this.x / length;
      this.y = this.y / length;
    }
    return this;
  }

  /**
   * 从指定坐标点复制坐标值
   * @param point - 源坐标点
   * @returns 当前实例，支持链式调用
   */
  copyFrom(point: IPoint): this {
    this.set(point.x, point.y);
    return this;
  }

  /**
   * 创建当前坐标点的副本
   * @returns 新的坐标点实例
   */
  clone(): Point {
    return new Point(this.x, this.y);
  }
}
