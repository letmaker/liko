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
 * 包围盒类，用于表示对象的边界区域
 */
export class Bounds {
  /** 最小的 X 坐标 */
  minX = Number.POSITIVE_INFINITY;
  /** 最小的 Y 坐标 */
  minY = Number.POSITIVE_INFINITY;
  /** 最大的 X 坐标 */
  maxX = Number.NEGATIVE_INFINITY;
  /** 最大的 Y 坐标 */
  maxY = Number.NEGATIVE_INFINITY;

  /** 包围盒的 x 坐标，等同于 minX */
  get x(): number {
    return this.minX;
  }

  /** 包围盒的 y 坐标，等同于 minY */
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

  /** 包围盒的左边沿，等同于 minX */
  get left(): number {
    return this.minX;
  }

  /** 包围盒的右边沿，等同于 maxX */
  get right(): number {
    return this.maxX;
  }

  /** 包围盒的顶部，等同于 minY */
  get top(): number {
    return this.minY;
  }

  /** 包围盒的底部，等同于 maxY */
  get bottom(): number {
    return this.maxY;
  }

  /** 是否有效，当 minX 和 minY 不为初始值时为有效 */
  get isValid(): boolean {
    return this.minX + this.minY !== Number.POSITIVE_INFINITY;
  }

  /** 是否为空，当 minX > maxX 或 minY > maxY 时为空 */
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

  /**
   * 创建一个包围盒实例
   * @param minX - 最小 X 坐标，默认为正无穷大
   * @param minY - 最小 Y 坐标，默认为正无穷大
   * @param maxX - 最大 X 坐标，默认为负无穷大
   * @param maxY - 最大 Y 坐标，默认为负无穷大
   */
  constructor(
    minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY,
  ) {
    this.set(minX, minY, maxX, maxY);
  }

  /**
   * 设置包围盒的边界值
   * @param minX - 最小 X 坐标
   * @param minY - 最小 Y 坐标
   * @param maxX - 最大 X 坐标
   * @param maxY - 最大 Y 坐标
   * @returns 当前实例，支持链式调用
   */
  set(minX: number, minY: number, maxX: number, maxY: number): this {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    return this;
  }

  /**
   * 重置包围盒到初始状态
   * @returns 当前实例，支持链式调用
   */
  reset(): this {
    this.minX = Number.POSITIVE_INFINITY;
    this.minY = Number.POSITIVE_INFINITY;
    this.maxX = Number.NEGATIVE_INFINITY;
    this.maxY = Number.NEGATIVE_INFINITY;
    return this;
  }

  /**
   * 添加两个顶点，左上角和右下角，扩展包围盒
   * @param x0 - 左上角 X 坐标
   * @param y0 - 左上角 Y 坐标
   * @param x1 - 右下角 X 坐标
   * @param y1 - 右下角 Y 坐标
   * @param matrix - 可选的变换矩阵，默认使用当前矩阵
   * @returns 当前实例，支持链式调用
   */
  addFrame(x0: number, y0: number, x1: number, y1: number, matrix?: Matrix): this {
    const { a, b, c, d, tx, ty } = matrix ?? defaultMatrix;
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
   * 添加矩形到包围盒
   * @param rect - 要添加的矩形
   * @param matrix - 可选的变换矩阵
   * @returns 当前实例，支持链式调用
   */
  addRect(rect: Rectangle, matrix?: Matrix): this {
    this.addFrame(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height, matrix);
    return this;
  }

  /**
   * 添加指定的包围盒到当前包围盒
   * @param bounds - 要添加的包围盒
   * @param matrix - 可选的变换矩阵
   * @returns 当前实例，支持链式调用
   */
  addBounds(bounds: BoundsData, matrix?: Matrix): this {
    this.addFrame(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, matrix);
    return this;
  }

  /**
   * 根据指定的 mask 包围盒，限制当前包围盒的范围
   * @param mask - 用于限制范围的遮罩包围盒
   * @returns 当前实例，支持链式调用
   */
  addBoundsMask(mask: Bounds): this {
    this.minX = this.minX > mask.minX ? this.minX : mask.minX;
    this.minY = this.minY > mask.minY ? this.minY : mask.minY;
    this.maxX = this.maxX < mask.maxX ? this.maxX : mask.maxX;
    this.maxY = this.maxY < mask.maxY ? this.maxY : mask.maxY;
    return this;
  }

  /**
   * 对包围盒的四个顶点应用矩阵变换
   * @param matrix - 要应用的矩阵
   * @returns 当前实例，支持链式调用
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
   * 限制包围盒在指定矩形区域内
   * @param rect - 限制的矩形区域
   * @returns 当前实例，支持链式调用
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
   * @param paddingX - x 方向扩展大小
   * @param paddingY - y 方向扩展大小，省略时与 paddingX 相同
   * @returns 当前实例，支持链式调用
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
   * @returns 当前实例，支持链式调用
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
   * @param x - x 轴缩放值
   * @param y - y 轴缩放值，省略时与 x 相同
   * @returns 当前实例，支持链式调用
   */
  scale(x: number, y: number = x): this {
    this.minX *= x;
    this.minY *= y;
    this.maxX *= x;
    this.maxY *= y;

    return this;
  }

  /**
   * 判断包围盒是否包含某坐标点
   * @param x - 要检测的 x 坐标
   * @param y - 要检测的 y 坐标
   * @returns 是否包含在包围盒内部
   */
  contains(x: number, y: number): boolean {
    if (this.minX <= x && this.minY <= y && this.maxX >= x && this.maxY >= y) {
      return true;
    }

    return false;
  }

  /**
   * 克隆当前包围盒
   * @returns 新的包围盒实例
   */
  clone(): Bounds {
    return new Bounds(this.minX, this.minY, this.maxX, this.maxY);
  }
}
