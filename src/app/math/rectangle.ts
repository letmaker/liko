import type { Bounds } from "./bounds";
import type { Matrix } from "./matrix";
import { Point } from "./point";

export interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const tempPoints = [new Point(), new Point(), new Point(), new Point()];

/**
 * 矩形区域
 */
export class Rectangle {
  /** 全局临时对象，方便复用，以减少对象创建 */
  static readonly TEMP = new Rectangle();

  /** x 轴坐标 */
  x = 0;
  /** y 轴坐标 */
  y = 0;
  /** 宽度 */
  width = 0;
  /** 高度 */
  height = 0;

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

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.set(x, y, width, height);
  }

  /**
   * 设置矩形数据
   */
  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  /**
   * 重置矩形
   */
  reset(): this {
    this.set(0, 0, 0, 0);
    return this;
  }

  /**
   * copy 指定的矩形信息到此矩形
   * @param rect 指定的矩形
   */
  copyFrom(rect: IRectangle): this {
    this.set(rect.x, rect.y, rect.width, rect.height);
    return this;
  }

  /**
   * copy 指定的 bounds 信息到此矩形
   * @param bounds bounds 信息
   */
  copyFromBounds(bounds: Bounds): this {
    this.set(bounds.minX, bounds.minY, bounds.width, bounds.height);
    return this;
  }

  /**
   * 判断两个矩形是否相等
   * @param rect 给定的矩形
   * @returns 是否相同
   */
  equals(rect: IRectangle): boolean {
    return rect.x === this.x && rect.y === this.y && rect.width === this.width && rect.height === this.height;
  }

  /**
   * 放大此矩形，以包含给定的矩形
   * @param rect 给定的矩形
   * @returns 返回当前矩形本身
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
   * 通过 paddingX 和 paddingY 扩展矩形区域
   * @param paddingX x 方向扩展大小
   * @param paddingY y 方向扩展大小，省略同 paddingX
   */
  pad(paddingX = 0, paddingY = paddingX): this {
    this.x -= paddingX;
    this.y -= paddingY;
    this.width += paddingX * 2;
    this.height += paddingY * 2;

    return this;
  }

  /**
   * 是否包含某坐标点
   * @param x x 坐标点
   * @param y y 坐标点
   * @returns 是否包含
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
   * 是否在线框内部
   * @param x x 坐标点
   * @param y y 坐标点
   * @param strokeWidth 线段宽度
   * @returns 是否包含在线宽内部
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
   * 两个矩形是否相交
   * @param other 另外的矩形
   * @param otherMatrix 另外的矩形的矩阵信息
   * @returns  是否相交
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
   * clone 矩形，返回新矩形
   */
  clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }
}
