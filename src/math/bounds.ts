import { Matrix } from './matrix';
import { Rectangle } from './rectangle';

export interface BoundsData {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const defaultMatrix = new Matrix();

/**
 * 包围盒类，用于表示对象的边界区域
 *
 * 包围盒是一个轴对齐的矩形区域，通过 minX、minY、maxX、maxY 四个值定义。
 * 主要用于碰撞检测、视口裁剪、渲染优化等场景。
 *
 * 特点：
 * - 支持链式调用，大部分方法返回 this
 * - 内置空间变换支持，可配合 Matrix 进行复杂变换
 * - 提供多种便捷属性访问方式（x/y、width/height、left/right/top/bottom）
 * - 支持与 Rectangle 类型互相转换
 *
 * 注意事项：
 * - 初始状态下 minX/minY 为正无穷，maxX/maxY 为负无穷，表示无效状态
 * - 空包围盒指 minX > maxX 或 minY > maxY 的情况
 * - 变换操作会直接修改当前实例，如需保留原数据请先 clone()
 *
 * @example
 * ```typescript
 * // 创建一个空的包围盒
 * const bounds = new Bounds();
 *
 * // 创建指定范围的包围盒
 * const bounds2 = new Bounds(0, 0, 100, 50);
 *
 * // 添加矩形区域到包围盒
 * bounds.addFrame(10, 10, 90, 40);
 *
 * // 检查点是否在包围盒内
 * if (bounds.contains(50, 25)) {
 *   console.log('点在包围盒内');
 * }
 *
 * // 对包围盒进行变换
 * const matrix = new Matrix().translate(100, 50).scale(2, 2);
 * bounds.applyMatrix(matrix);
 *
 * // 获取包围盒信息
 * console.log(`宽度: ${bounds.width}, 高度: ${bounds.height}`);
 * ```
 */
export class Bounds {
  /**
   * 包围盒的最小 X 坐标
   * @default Number.POSITIVE_INFINITY
   */
  minX = Number.POSITIVE_INFINITY;

  /**
   * 包围盒的最小 Y 坐标
   * @default Number.POSITIVE_INFINITY
   */
  minY = Number.POSITIVE_INFINITY;

  /**
   * 包围盒的最大 X 坐标
   * @default Number.NEGATIVE_INFINITY
   */
  maxX = Number.NEGATIVE_INFINITY;

  /**
   * 包围盒的最大 Y 坐标
   * @default Number.NEGATIVE_INFINITY
   */
  maxY = Number.NEGATIVE_INFINITY;

  /**
   * 包围盒的起始 X 坐标，等同于 minX
   * 提供更语义化的属性访问方式
   */
  get x(): number {
    return this.minX;
  }

  /**
   * 包围盒的起始 Y 坐标，等同于 minY
   * 提供更语义化的属性访问方式
   */
  get y(): number {
    return this.minY;
  }

  /**
   * 包围盒的宽度
   * 计算公式：maxX - minX
   * @returns 如果包围盒无效或为空，可能返回负数或 NaN
   */
  get width(): number {
    return this.maxX - this.minX;
  }

  /**
   * 包围盒的高度
   * 计算公式：maxY - minY
   * @returns 如果包围盒无效或为空，可能返回负数或 NaN
   */
  get height(): number {
    return this.maxY - this.minY;
  }

  /**
   * 包围盒的左边界，等同于 minX
   * 提供更语义化的属性访问方式
   */
  get left(): number {
    return this.minX;
  }

  /**
   * 包围盒的右边界，等同于 maxX
   * 提供更语义化的属性访问方式
   */
  get right(): number {
    return this.maxX;
  }

  /**
   * 包围盒的上边界，等同于 minY
   * 提供更语义化的属性访问方式
   */
  get top(): number {
    return this.minY;
  }

  /**
   * 包围盒的下边界，等同于 maxY
   * 提供更语义化的属性访问方式
   */
  get bottom(): number {
    return this.maxY;
  }

  /**
   * 检查包围盒是否有效
   * 包围盒在初始化后，如果没有添加任何内容，则为无效状态
   * @returns 当 minX 和 minY 不为初始的正无穷值时返回 true
   */
  get isValid(): boolean {
    return this.minX + this.minY !== Number.POSITIVE_INFINITY;
  }

  /**
   * 检查包围盒是否为空
   * 空包围盒表示没有实际的区域面积
   * @returns 当 minX > maxX 或 minY > maxY 时返回 true
   */
  get isEmpty(): boolean {
    return this.minX > this.maxX || this.minY > this.maxY;
  }

  private _rectangle?: Rectangle;
  /**
   * 将包围盒转换为矩形对象
   * 返回的矩形对象会被缓存，多次调用返回同一实例
   * @returns Rectangle 实例，如果包围盒为空则返回零尺寸矩形
   */
  get rectangle(): Rectangle {
    this._rectangle ??= new Rectangle();
    this.isEmpty ? this._rectangle.set(0, 0, 0, 0) : this._rectangle.copyFromBounds(this);
    return this._rectangle;
  }

  /**
   * 创建一个包围盒实例
   * @param minX - 最小 X 坐标，默认为正无穷大（表示无效状态）
   * @param minY - 最小 Y 坐标，默认为正无穷大（表示无效状态）
   * @param maxX - 最大 X 坐标，默认为负无穷大（表示无效状态）
   * @param maxY - 最大 Y 坐标，默认为负无穷大（表示无效状态）
   */
  constructor(
    minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY
  ) {
    this.set(minX, minY, maxX, maxY);
  }

  /**
   * 直接设置包围盒的边界值
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
   * 重置包围盒到初始的无效状态
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
   * 通过两个对角点添加矩形区域到包围盒
   * 此方法会考虑变换矩阵，对四个顶点进行完整的矩阵变换
   * @param x0 - 左上角 X 坐标
   * @param y0 - 左上角 Y 坐标
   * @param x1 - 右下角 X 坐标
   * @param y1 - 右下角 Y 坐标
   * @param matrix - 可选的变换矩阵，不提供则使用默认单位矩阵
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
   * 添加矩形对象到包围盒
   * @param rect - 要添加的矩形对象
   * @param matrix - 可选的变换矩阵
   * @returns 当前实例，支持链式调用
   */
  addRect(rect: Rectangle, matrix?: Matrix): this {
    this.addFrame(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height, matrix);
    return this;
  }

  /**
   * 合并另一个包围盒到当前包围盒
   * @param bounds - 要合并的包围盒数据
   * @param matrix - 可选的变换矩阵
   * @returns 当前实例，支持链式调用
   */
  addBounds(bounds: BoundsData, matrix?: Matrix): this {
    this.addFrame(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, matrix);
    return this;
  }

  /**
   * 使用遮罩包围盒限制当前包围盒的范围，结果是当前包围盒与遮罩包围盒的交集
   * 如果没有交集，结果将是一个空包围盒
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
   * 对包围盒应用矩阵变换
   * 会计算四个顶点变换后的位置，然后重新计算包围盒范围
   * 注意：旋转等变换可能会改变包围盒的大小
   * @param matrix - 要应用的变换矩阵
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
   * 将包围盒限制在指定矩形区域内，超出矩形范围的部分会被裁剪掉
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
   * 通过内边距扩展包围盒区域，正数值扩大包围盒，负数值缩小包围盒
   * @param paddingX - X 方向的扩展像素数
   * @param paddingY - Y 方向的扩展像素数，省略时与 paddingX 相同
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
   * 对包围盒坐标进行向上取整处理
   * 左上角坐标向下取整（确保包含原区域），右下角坐标向上取整
   * 常用于像素对齐或确保完整覆盖某个区域
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
   * 按比例缩放包围盒，所有坐标值都会乘以对应的缩放因子
   * @param x - X 轴缩放比例
   * @param y - Y 轴缩放比例，省略时与 x 相同
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
   * 检查指定坐标点是否在包围盒内，边界上的点被认为是包含在内的
   * @param x - 要检测的 X 坐标
   * @param y - 要检测的 Y 坐标
   * @returns 点在包围盒内（包括边界）时返回 true
   */
  contains(x: number, y: number): boolean {
    if (this.minX <= x && this.minY <= y && this.maxX >= x && this.maxY >= y) {
      return true;
    }

    return false;
  }

  /**
   * 创建当前包围盒的完整副本，返回的新实例与原实例完全独立
   * @returns 新的包围盒实例
   */
  clone(): Bounds {
    return new Bounds(this.minX, this.minY, this.maxX, this.maxY);
  }
}
