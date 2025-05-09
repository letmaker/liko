import type { Bounds } from './bounds';
import type { Matrix } from './matrix';
import { Point } from './point';

export interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const tempPoints = [new Point(), new Point(), new Point(), new Point()];

/**
 * 二维矩形区域类
 */
export class Rectangle {
  /** 全局临时矩形对象，用于减少对象创建开销 */
  static readonly TEMP = new Rectangle();

  /** 矩形左上角的 x 坐标 */
  x = 0;
  /** 矩形左上角的 y 坐标 */
  y = 0;
  /** 矩形的宽度，单位为像素 */
  width = 0;
  /** 矩形的高度，单位为像素 */
  height = 0;

  /** 获取矩形的左边界坐标，等同于 x */
  get left(): number {
    return this.x;
  }

  /** 获取矩形的右边界坐标 */
  get right(): number {
    return this.x + this.width;
  }

  /** 获取矩形的上边界坐标，等同于 y */
  get top(): number {
    return this.y;
  }

  /** 获取矩形的下边界坐标 */
  get bottom(): number {
    return this.y + this.height;
  }

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.set(x, y, width, height);
  }

  /**
   * 设置矩形的位置和大小
   * @param x - 左上角的 x 坐标
   * @param y - 左上角的 y 坐标
   * @param width - 矩形的宽度
   * @param height - 矩形的高度
   * @returns 当前矩形实例，支持链式调用
   */
  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  /**
   * 重置矩形的所有属性为默认值（0）
   * @returns 当前矩形实例，支持链式调用
   */
  reset(): this {
    this.set(0, 0, 0, 0);
    return this;
  }

  /**
   * 从指定的矩形对象复制属性值到当前矩形
   * @param rect - 源矩形对象
   * @returns 当前矩形实例，支持链式调用
   */
  copyFrom(rect: IRectangle): this {
    this.set(rect.x, rect.y, rect.width, rect.height);
    return this;
  }

  /**
   * 从指定的边界对象复制属性值到当前矩形
   * @param bounds - 源边界对象
   * @returns 当前矩形实例，支持链式调用
   */
  copyFromBounds(bounds: Bounds): this {
    this.set(bounds.minX, bounds.minY, bounds.width, bounds.height);
    return this;
  }

  /**
   * 判断当前矩形与指定矩形的所有属性值是否完全相等
   * @param rect - 待比较的矩形对象
   * @returns 如果所有属性值都相等则返回 true，否则返回 false
   */
  equals(rect: IRectangle): boolean {
    return rect.x === this.x && rect.y === this.y && rect.width === this.width && rect.height === this.height;
  }

  /**
   * 扩展当前矩形以完全包含指定的矩形
   * @param rect - 需要包含的目标矩形
   * @returns 当前矩形实例，支持链式调用
   */
  fit(rect: Rectangle): this {
    const x1 = Math.min(this.x, rect.x);
    const x2 = Math.max(this.x + this.width, rect.x + rect.width);
    const y1 = Math.min(this.y, rect.y);
    const y2 = Math.max(this.y + this.height, rect.y + rect.height);

    this.x = x1;
    this.width = x2 - x1;
    this.y = y1;
    this.height = y2 - y1;

    return this;
  }

  /**
   * 按指定的内边距扩展矩形的四个边
   * @param paddingX - 水平方向的内边距值
   * @param paddingY - 垂直方向的内边距值，默认等于 paddingX
   * @returns 当前矩形实例，支持链式调用
   */
  pad(paddingX = 0, paddingY = paddingX): this {
    this.x -= paddingX;
    this.y -= paddingY;
    this.width += paddingX * 2;
    this.height += paddingY * 2;

    return this;
  }

  /**
   * 判断指定坐标点是否在矩形区域内
   * @param x - 待检测点的 x 坐标
   * @param y - 待检测点的 y 坐标
   * @returns 如果点在矩形内（包含边界）返回 true，否则返回 false
   */
  contains(x: number, y: number): boolean {
    if (x >= this.x && x < this.x + this.width) {
      if (y >= this.y && y < this.y + this.height) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断指定坐标点是否在矩形的描边区域内
   * @param x - 待检测点的 x 坐标
   * @param y - 待检测点的 y 坐标
   * @param strokeWidth - 描边的宽度
   * @returns 如果点在描边区域内返回 true，否则返回 false
   */
  strokeContains(x: number, y: number, strokeWidth: number): boolean {
    const { width, height } = this;

    if (width <= 0 || height <= 0) return false;

    const _x = this.x;
    const _y = this.y;

    const outerLeft = _x - strokeWidth / 2;
    const outerRight = _x + width + strokeWidth / 2;
    const outerTop = _y - strokeWidth / 2;
    const outerBottom = _y + height + strokeWidth / 2;
    const innerLeft = _x + strokeWidth / 2;
    const innerRight = _x + width - strokeWidth / 2;
    const innerTop = _y + strokeWidth / 2;
    const innerBottom = _y + height - strokeWidth / 2;

    return (
      x >= outerLeft &&
      x <= outerRight &&
      y >= outerTop &&
      y <= outerBottom &&
      !(x > innerLeft && x < innerRight && y > innerTop && y < innerBottom)
    );
  }

  /**
   * 判断当前矩形是否与另一个矩形相交
   * @param other - 待检测的矩形对象
   * @param otherMatrix - 可选的变换矩阵，用于在检测前对待检测矩形进行变换
   * @returns 如果两个矩形相交返回 true，否则返回 false
   */
  intersects(other: Rectangle, otherMatrix?: Matrix): boolean {
    if (!otherMatrix) {
      const x0 = this.x < other.x ? other.x : this.x;
      const x1 = this.right > other.right ? other.right : this.right;

      if (x1 <= x0) {
        return false;
      }

      const y0 = this.y < other.y ? other.y : this.y;
      const y1 = this.bottom > other.bottom ? other.bottom : this.bottom;

      return y1 > y0;
    }

    const x0 = this.left;
    const x1 = this.right;
    const y0 = this.top;
    const y1 = this.bottom;

    if (x1 <= x0 || y1 <= y0) {
      return false;
    }

    const lt = tempPoints[0].set(other.left, other.top);
    const lb = tempPoints[1].set(other.left, other.bottom);
    const rt = tempPoints[2].set(other.right, other.top);
    const rb = tempPoints[3].set(other.right, other.bottom);

    if (rt.x <= lt.x || lb.y <= lt.y) {
      return false;
    }

    const s = Math.sign(otherMatrix.a * otherMatrix.d - otherMatrix.b * otherMatrix.c);

    if (s === 0) {
      return false;
    }

    otherMatrix.apply(lt, lt);
    otherMatrix.apply(lb, lb);
    otherMatrix.apply(rt, rt);
    otherMatrix.apply(rb, rb);

    if (
      Math.max(lt.x, lb.x, rt.x, rb.x) <= x0 ||
      Math.min(lt.x, lb.x, rt.x, rb.x) >= x1 ||
      Math.max(lt.y, lb.y, rt.y, rb.y) <= y0 ||
      Math.min(lt.y, lb.y, rt.y, rb.y) >= y1
    ) {
      return false;
    }

    const nx = s * (lb.y - lt.y);
    const ny = s * (lt.x - lb.x);
    const n00 = nx * x0 + ny * y0;
    const n10 = nx * x1 + ny * y0;
    const n01 = nx * x0 + ny * y1;
    const n11 = nx * x1 + ny * y1;

    if (
      Math.max(n00, n10, n01, n11) <= nx * lt.x + ny * lt.y ||
      Math.min(n00, n10, n01, n11) >= nx * rb.x + ny * rb.y
    ) {
      return false;
    }

    const mx = s * (lt.y - rt.y);
    const my = s * (rt.x - lt.x);
    const m00 = mx * x0 + my * y0;
    const m10 = mx * x1 + my * y0;
    const m01 = mx * x0 + my * y1;
    const m11 = mx * x1 + my * y1;

    if (
      Math.max(m00, m10, m01, m11) <= mx * lt.x + my * lt.y ||
      Math.min(m00, m10, m01, m11) >= mx * rb.x + my * rb.y
    ) {
      return false;
    }

    return true;
  }

  /**
   * 创建当前矩形的一个副本
   * @returns 一个新的矩形实例，包含与当前矩形相同的属性值
   */
  clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }
}
