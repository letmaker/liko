import type { IRectangle } from './rectangle';

/**
 * 支持旋转的矩形接口，继承自 IRectangle 并添加旋转属性
 */
export interface IRotatingRect extends IRectangle {
  /** 旋转角度（弧度），正值表示顺时针旋转 */
  rotation: number;
}

/**
 * 可旋转的矩形类，在普通矩形基础上增加了旋转功能
 * 提供了位置、尺寸和旋转角度的基本属性，以及边界获取和矩形操作等功能
 *
 * 使用示例：
 * ```typescript
 * // 创建一个在 (10, 20) 位置，100x50 大小，旋转 45 度的矩形
 * const rect = new RotatingRect(10, 20, 100, 50, Math.PI / 4);
 *
 * // 或者先创建再设置属性
 * const rect2 = new RotatingRect();
 * rect2.set(0, 0, 200, 100, Math.PI / 2);
 *
 * // 复制另一个矩形的属性
 * const rect3 = new RotatingRect();
 * rect3.copyFrom(rect);
 *
 * // 使用全局临时对象进行计算（避免创建新对象）
 * RotatingRect.TEMP.set(x, y, w, h, r);
 * ```
 *
 * 注意事项：
 * - rotation 属性使用弧度制，不是角度制
 * - 使用 TEMP 静态对象时要注意它是全局共享的对象，使用时要小心避免冲突
 * - left/right/top/bottom 边界是基于未旋转状态的矩形计算的
 */
export class RotatingRect {
  /**
   * 全局临时对象，用于复用以减少对象创建
   * 注意：这是全局共享的对象，使用时要小心避免冲突
   */
  static readonly TEMP = new RotatingRect();

  /** 矩形左上角的 x 轴坐标位置 */
  x = 0;

  /** 矩形左上角的 y 轴坐标位置 */
  y = 0;

  /** 矩形的宽度（像素单位） */
  width = 0;

  /** 矩形的高度（像素单位） */
  height = 0;

  /** 矩形的旋转角度（弧度制），以矩形中心为旋转点，正值表示顺时针旋转 */
  rotation = 0;

  /**
   * 获取矩形左边界位置（等同于 x 坐标）
   * 注意：这是基于未旋转状态的边界值
   */
  get left(): number {
    return this.x;
  }

  /**
   * 获取矩形右边界位置（x 坐标 + 宽度）
   * 注意：这是基于未旋转状态的边界值
   */
  get right(): number {
    return this.x + this.width;
  }

  /**
   * 获取矩形上边界位置（等同于 y 坐标）
   * 注意：这是基于未旋转状态的边界值
   */
  get top(): number {
    return this.y;
  }

  /**
   * 获取矩形下边界位置（y 坐标 + 高度）
   * 注意：这是基于未旋转状态的边界值
   */
  get bottom(): number {
    return this.y + this.height;
  }

  /**
   * 创建一个新的旋转矩形实例
   * @param x - 矩形左上角的 x 坐标位置，默认为 0
   * @param y - 矩形左上角的 y 坐标位置，默认为 0
   * @param width - 矩形的宽度，默认为 0
   * @param height - 矩形的高度，默认为 0
   * @param rotation - 矩形的旋转角度（弧度制），默认为 0
   */
  constructor(x = 0, y = 0, width = 0, height = 0, rotation = 0) {
    this.set(x, y, width, height, rotation);
  }

  /**
   * 设置旋转矩形的所有属性
   * @param x - 矩形左上角的 x 坐标位置
   * @param y - 矩形左上角的 y 坐标位置
   * @param width - 矩形的宽度
   * @param height - 矩形的高度
   * @param rotation - 矩形的旋转角度（弧度制），如果不提供则保持当前值
   * @returns 当前实例，支持链式调用
   */
  set(x: number, y: number, width: number, height: number, rotation?: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rotation = rotation ?? this.rotation;
    return this;
  }

  /**
   * 重置旋转矩形的所有属性为默认值（0, 0, 0, 0, 0）
   * 常用于对象池或临时对象的重置
   * @returns 当前实例，支持链式调用
   */
  reset(): this {
    this.set(0, 0, 0, 0, 0);
    return this;
  }

  /**
   * 从指定的旋转矩形对象复制所有属性到当前实例
   * 用于快速复制另一个矩形的所有属性值
   * @param rect - 源旋转矩形对象，必须包含 IRotatingRect 接口定义的所有属性
   * @returns 当前实例，支持链式调用
   */
  copyFrom(rect: IRotatingRect): this {
    this.set(rect.x, rect.y, rect.width, rect.height, rect.rotation);
    return this;
  }

  /**
   * 创建当前旋转矩形的完整副本
   * 返回一个新的 RotatingRect 实例，包含相同的所有属性值
   * @returns 新的旋转矩形实例，与当前实例属性完全相同但是独立的对象
   */
  clone(): RotatingRect {
    return new RotatingRect(this.x, this.y, this.width, this.height, this.rotation);
  }
}
