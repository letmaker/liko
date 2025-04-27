import type { IRectangle } from "./rectangle";

/** 支持旋转的矩形接口，继承自 IRectangle 并添加旋转属性 */
export interface IRotatingRect extends IRectangle {
  /** 旋转角度（弧度） */
  rotation: number;
}

/**
 * 可旋转的矩形类，在普通矩形基础上增加了旋转功能
 * 提供了位置、尺寸和旋转角度的基本属性，以及边界获取和矩形操作等功能
 */
export class RotatingRect {
  /** 全局临时对象，用于复用以减少对象创建 */
  static readonly TEMP = new RotatingRect();

  /** x 轴坐标位置 */
  x = 0;
  /** y 轴坐标位置 */
  y = 0;
  /** 矩形宽度 */
  width = 0;
  /** 矩形高度 */
  height = 0;
  /** 旋转角度（弧度） */
  rotation = 0;

  /** 获取矩形左边界位置（等同于 x 坐标） */
  get left(): number {
    return this.x;
  }

  /** 获取矩形右边界位置（x 坐标 + 宽度） */
  get right(): number {
    return this.x + this.width;
  }

  /** 获取矩形上边界位置（等同于 y 坐标） */
  get top(): number {
    return this.y;
  }

  /** 获取矩形下边界位置（y 坐标 + 高度） */
  get bottom(): number {
    return this.y + this.height;
  }

  /**
   * 创建一个新的旋转矩形实例
   * @param x - 矩形的 x 坐标位置
   * @param y - 矩形的 y 坐标位置
   * @param width - 矩形的宽度
   * @param height - 矩形的高度
   * @param rotation - 矩形的旋转角度（弧度）
   */
  constructor(x = 0, y = 0, width = 0, height = 0, rotation = 0) {
    this.set(x, y, width, height, rotation);
  }

  /**
   * 设置旋转矩形的所有属性
   * @param x - 矩形的 x 坐标位置
   * @param y - 矩形的 y 坐标位置
   * @param width - 矩形的宽度
   * @param height - 矩形的高度
   * @param rotation - 矩形的旋转角度（弧度），默认为 0
   * @returns 当前实例，支持链式调用
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
   * 重置旋转矩形的所有属性为默认值
   * @returns 当前实例，支持链式调用
   */
  reset(): this {
    this.set(0, 0, 0, 0, 0);
    return this;
  }

  /**
   * 从指定的旋转矩形复制所有属性
   * @param rect - 源旋转矩形
   * @returns 当前实例，支持链式调用
   */
  copyFrom(rect: IRotatingRect): this {
    this.set(rect.x, rect.y, rect.width, rect.height, rect.rotation);
    return this;
  }

  /**
   * 创建当前旋转矩形的副本
   * @returns 新的旋转矩形实例
   */
  clone(): RotatingRect {
    return new RotatingRect(this.x, this.y, this.width, this.height, this.rotation);
  }
}
