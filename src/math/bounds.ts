import { Matrix } from "./matrix";
import { Rectangle } from "./rectangle";

export interface BoundsData {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const defaultMatrix = new Matrix();

/**
 * 包围盒
 */
export class Bounds {
  private _matrix = defaultMatrix;

  /** 最小的 X */
  minX = Number.POSITIVE_INFINITY;
  /** 最小的 Y */
  minY = Number.POSITIVE_INFINITY;
  /** 最大的 X */
  maxX = Number.NEGATIVE_INFINITY;
  /** 最大的 Y */
  maxY = Number.NEGATIVE_INFINITY;

  /** 包围盒的 x 坐标 */
  get x(): number {
    return this.minX;
  }

  /** 包围盒的 y 坐标 */
  get y(): number {
    return this.minY;
  }

  /** 包围盒的宽度 */
  get width(): number {
    return this.maxX - this.minX;
  }

  /** 包围盒的高度 */
  get height(): number {
    return this.maxY - this.minY;
  }

  /** 包围盒的左边沿 */
  get left(): number {
    return this.minX;
  }

  /** 包围盒的右边沿 */
  get right(): number {
    return this.maxX;
  }

  /** 包围盒的顶部 */
  get top(): number {
    return this.minY;
  }

  /** 包围盒的底部 */
  get bottom(): number {
    return this.maxY;
  }

  /** 是否有效 */
  get isValid(): boolean {
    return this.minX + this.minY !== Number.POSITIVE_INFINITY;
  }

  /** 是否是空 */
  get isEmpty(): boolean {
    return this.minX > this.maxX || this.minY > this.maxY;
  }

  private _rectangle?: Rectangle;
  /** 从包围盒获得矩形区域 */
  get rectangle(): Rectangle {
    this._rectangle ??= new Rectangle();
    this.isEmpty ? this._rectangle.set(0, 0, 0, 0) : this._rectangle.copyFromBounds(this);
    return this._rectangle;
  }

  constructor(
    minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY,
  ) {
    this.set(minX, minY, maxX, maxY);
  }

  /**
   * 设置包围盒
   */
  set(minX: number, minY: number, maxX: number, maxY: number): this {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    return this;
  }

  /**
   * 重置包围盒
   */
  reset(): this {
    this.minX = Number.POSITIVE_INFINITY;
    this.minY = Number.POSITIVE_INFINITY;
    this.maxX = Number.NEGATIVE_INFINITY;
    this.maxY = Number.NEGATIVE_INFINITY;

    this._matrix = defaultMatrix;
    return this;
  }

  /**
   * 设置包围盒的当前矩阵
   * @param matrix 设置包围盒的矩阵
   */
  setMatrix(matrix: Matrix): this {
    this._matrix = matrix;
    return this;
  }

  /**
   * 添加两个顶点，左上角和右下角
   */
  addFrame(x0: number, y0: number, x1: number, y1: number, matrix?: Matrix): this {
    const { a, b, c, d, tx, ty } = matrix ?? this._matrix;
    let { minX, minY, maxX, maxY } = this;

    let x = a * x0 + c * y0 + tx;
    let y = b * x0 + d * y0 + ty;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    x = a * x1 + c * y0 + tx;
    y = b * x1 + d * y0 + ty;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    x = a * x0 + c * y1 + tx;
    y = b * x0 + d * y1 + ty;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    x = a * x1 + c * y1 + tx;
    y = b * x1 + d * y1 + ty;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;

    return this;
  }

  /**
   * 添加矩形
   * @param rect 矩形
   * @param matrix 矩形的矩阵
   */
  addRect(rect: Rectangle, matrix?: Matrix): this {
    this.addFrame(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height, matrix);
    return this;
  }

  /**
   * 添加指定的包围盒
   * @param bounds 指定的包围盒
   * @param matrix 包围盒的矩阵信息
   */
  addBounds(bounds: BoundsData, matrix?: Matrix): this {
    this.addFrame(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, matrix);
    return this;
  }

  /**
   * 根据指定的 mask 点，遮罩减少包围盒
   * @param mask 遮罩包围盒
   */
  addBoundsMask(mask: Bounds): this {
    this.minX = this.minX > mask.minX ? this.minX : mask.minX;
    this.minY = this.minY > mask.minY ? this.minY : mask.minY;
    this.maxX = this.maxX < mask.maxX ? this.maxX : mask.maxX;
    this.maxY = this.maxY < mask.maxY ? this.maxY : mask.maxY;
    return this;
  }

  /**
   * 对包围盒的点施加矩阵信息
   * @param matrix 矩阵
   */
  applyMatrix(matrix: Matrix): this {
    const { minX, minY, maxX, maxY } = this;
    const { a, b, c, d, tx, ty } = matrix;

    let x = a * minX + c * minY + tx;
    let y = b * minX + d * minY + ty;

    this.minX = x;
    this.minY = y;
    this.maxX = x;
    this.maxY = y;

    x = a * maxX + c * minY + tx;
    y = b * maxX + d * minY + ty;
    this.minX = x < this.minX ? x : this.minX;
    this.minY = y < this.minY ? y : this.minY;
    this.maxX = x > this.maxX ? x : this.maxX;
    this.maxY = y > this.maxY ? y : this.maxY;

    x = a * minX + c * maxY + tx;
    y = b * minX + d * maxY + ty;
    this.minX = x < this.minX ? x : this.minX;
    this.minY = y < this.minY ? y : this.minY;
    this.maxX = x > this.maxX ? x : this.maxX;
    this.maxY = y > this.maxY ? y : this.maxY;

    x = a * maxX + c * maxY + tx;
    y = b * maxX + d * maxY + ty;
    this.minX = x < this.minX ? x : this.minX;
    this.minY = y < this.minY ? y : this.minY;
    this.maxX = x > this.maxX ? x : this.maxX;
    this.maxY = y > this.maxY ? y : this.maxY;
    return this;
  }

  /**
   * 重置包围盒，使得能包含指定的矩形区域
   * @param rect 矩形区域
   */
  fit(rect: Rectangle): this {
    if (this.minX < rect.left) this.minX = rect.left;
    if (this.maxX > rect.right) this.maxX = rect.right;
    if (this.minY < rect.top) this.minY = rect.top;
    if (this.maxY > rect.bottom) this.maxY = rect.bottom;

    return this;
  }

  /**
   * 通过 paddingX 和 paddingY 扩展包围盒区域
   * @param paddingX x 方向扩展大小
   * @param paddingY y 方向扩展大小，省略同 paddingX
   */
  pad(paddingX: number, paddingY: number = paddingX): this {
    this.minX -= paddingX;
    this.maxX += paddingX;
    this.minY -= paddingY;
    this.maxY += paddingY;

    return this;
  }

  /**
   * 天花板处理：左上角取下限值，右下角取上限值
   */
  ceil(): this {
    this.minX = Math.floor(this.minX);
    this.minY = Math.floor(this.minY);
    this.maxX = Math.ceil(this.maxX);
    this.maxY = Math.ceil(this.maxY);

    return this;
  }

  /**
   * 缩放包围盒
   * @param x  x 轴缩放值
   * @param y  y 轴缩放值，省略同 x
   */
  scale(x: number, y: number = x): this {
    this.minX *= x;
    this.minY *= y;
    this.maxX *= x;
    this.maxY *= y;

    return this;
  }

  /**
   * 是否包含某坐标点
   * @param x x 坐标点
   * @param y y 坐标点
   * @returns 是否包含在 Bounds 内部
   */
  contains(x: number, y: number): boolean {
    if (this.minX <= x && this.minY <= y && this.maxX >= x && this.maxY >= y) {
      return true;
    }

    return false;
  }

  /**
   * clone 包围盒
   */
  clone(): Bounds {
    return new Bounds(this.minX, this.minY, this.maxX, this.maxY);
  }
}
