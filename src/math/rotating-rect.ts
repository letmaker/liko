import type { IRectangle } from "./rectangle";

export interface IRotatingRect extends IRectangle {
  rotation: number;
}

/**
 * 旋转矩形，相比 Rectangle 多一个旋转角
 */
export class RotatingRect {
  static readonly TEMP = new RotatingRect();

  /** x 轴坐标 */
  x = 0;
  /** y 轴坐标 */
  y = 0;
  /** 宽度 */
  width = 0;
  /** 高度 */
  height = 0;
  /** 旋转弧度值 */
  rotation = 0;

  /** 矩形的左边缘，等同于 x */
  get left(): number {
    return this.x;
  }

  /** 矩形的右边缘 */
  get right(): number {
    return this.x + this.width;
  }

  /** 矩形的顶部，等同于 y */
  get top(): number {
    return this.y;
  }

  /** 矩形的底部 */
  get bottom(): number {
    return this.y + this.height;
  }

  constructor(x = 0, y = 0, width = 0, height = 0, rotation = 0) {
    this.set(x, y, width, height, rotation);
  }

  /**
   * 设置旋转矩形数据
   */
  set(x: number, y: number, width: number, height: number, rotation?: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rotation = rotation ?? 0;
    return this;
  }

  /**
   * 重置旋转矩形
   */
  reset(): this {
    this.set(0, 0, 0, 0, 0);
    return this;
  }

  /**
   * copy 指定的旋转矩形信息到此矩形
   * @param rect 指定的矩形
   */
  copyFrom(rect: IRotatingRect): this {
    this.set(rect.x, rect.y, rect.width, rect.height, rect.rotation);
    return this;
  }

  /**
   * clone 旋转矩形，返回新矩形
   */
  clone(): RotatingRect {
    return new RotatingRect(this.x, this.y, this.width, this.height, this.rotation);
  }
}
