/**
 * 二维坐标点接口
 * 定义了平面坐标系中点的基本结构
 */
export interface IPoint {
  /** x 轴坐标值 */
  x: number;
  /** y 轴坐标值 */
  y: number;
}

/**
 * 二维坐标点类
 * 提供完整的二维平面坐标点操作功能，包括位置设置、距离计算、角度计算等
 *
 * @example
 * ```typescript
 * // 创建坐标点
 * const point = new Point(10, 20);
 *
 * // 计算两点距离
 * const distance = point.distance({ x: 0, y: 0 });
 *
 * // 链式操作
 * point.set(5, 5).add(10, 10).normalize();
 *
 * // 使用临时对象减少内存分配
 * const temp = Point.TEMP.set(x, y);
 * ```
 */
export class Point {
  /**
   * 全局临时对象，用于复用以减少对象创建开销
   * 注意：此对象会被全局共享，使用后应立即处理结果，不要长期持有引用
   */
  static readonly TEMP = new Point();

  /** x 轴坐标值 */
  x = 0;
  /** y 轴坐标值 */
  y = 0;

  /**
   * 获取当前坐标点的长度
   * @returns 当前坐标点的长度
   */
  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 创建一个新的坐标点实例
   * @param x - x 轴坐标值，默认为 0
   * @param y - y 轴坐标值，默认为 0
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置坐标点的位置
   * @param x - x 轴坐标值，默认为 0
   * @param y - y 轴坐标值，默认等于 x 的值
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
   * 使用严格相等比较，不进行浮点数误差处理
   * @param point - 待比较的坐标点
   * @returns 两点是否完全重合
   */
  equals(point: IPoint): boolean {
    return point.x === this.x && point.y === this.y;
  }

  /**
   * 计算当前点到目标点的夹角
   * 角度从正 x 轴开始计算，逆时针为正方向
   * @param point - 目标点坐标
   * @returns 两点间的夹角，范围为 [-π, π] 弧度
   */
  radian(point: IPoint): number {
    return Math.atan2(point.y - this.y, point.x - this.x);
  }

  /**
   * 计算当前点到目标点的欧几里得距离
   * @param point - 目标点坐标
   * @returns 两点间的直线距离，始终为非负数
   */
  distance(point: IPoint): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 将坐标点按指定增量进行偏移
   * @param point - 偏移量
   * @returns 当前实例，支持链式调用
   */
  add(point: IPoint): this {
    this.x += point.x;
    this.y += point.y;
    return this;
  }

  /**
   * 从当前点减去另一个点
   * @param point - 被减去的点
   * @returns 当前实例，支持链式调用
   */
  sub(point: IPoint): this {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  }

  /**
   * 将当前点乘以一个标量
   * @param scalar - 乘数
   * @returns 当前实例，支持链式调用
   */
  multiply(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * 将当前点作为向量进行归一化处理
   * 归一化后向量长度为 1，方向保持不变
   * 注意：零向量 (0,0) 归一化后仍为零向量
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
   * 从指定坐标点复制坐标值到当前实例
   * @param point - 源坐标点
   * @returns 当前实例，支持链式调用
   */
  copyFrom(point: IPoint): this {
    this.set(point.x, point.y);
    return this;
  }

  /**
   * 创建当前坐标点的副本
   * @returns 新的坐标点实例，与当前实例具有相同的坐标值
   */
  clone(): Point {
    return new Point(this.x, this.y);
  }
}
