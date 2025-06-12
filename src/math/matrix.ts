import { PI2 } from '../const';
import { type IPoint, Point } from './point';
import type { Transform } from './transform';

/**
 * 2D 矩阵类，用于处理二维空间中的变换操作
 *
 * 矩阵表示形式：
 * ```
 * | a | c | tx|
 * | b | d | ty|
 * | 0 | 0 | 1 |
 * ```
 *
 * @example
 * ```typescript
 * // 创建单位矩阵
 * const matrix = new Matrix();
 *
 * // 创建自定义矩阵
 * const customMatrix = new Matrix(2, 0, 0, 2, 100, 50);
 *
 * // 链式调用进行变换
 * matrix.translate(10, 20).scale(2, 2).rotate(Math.PI / 4);
 *
 * // 应用变换到点
 * const point = new Point(10, 10);
 * const transformedPoint = matrix.apply(point);
 *
 * // 使用全局单位矩阵
 * const identity = Matrix.IDENTITY;
 *
 * // 使用临时矩阵进行计算
 * const temp = Matrix.TEMP.translate(5, 5);
 * ```
 */
export class Matrix {
  /**
   * 全局单位矩阵，只读，始终保持单位矩阵状态
   * @readonly
   * @returns 只读的单位矩阵实例
   */
  static get IDENTITY(): Readonly<Matrix> {
    return identityMatrix.identity();
  }

  /**
   * 全局临时矩阵对象，用于减少对象创建开销
   *
   * 注意事项：
   * - 获取时自动重置为单位矩阵
   * - 多处使用时需要注意数据覆盖问题
   * - 不适用于需要保持状态的场景
   */
  static get TEMP(): Matrix {
    return tempMatrix.identity();
  }

  /** x 轴缩放分量 */
  a = 1;

  /** y 轴倾斜分量（剪切变换） */
  b = 0;

  /** x 轴倾斜分量（剪切变换） */
  c = 0;

  /** y 轴缩放分量 */
  d = 1;

  /** x 轴平移分量 */
  tx = 0;

  /** y 轴平移分量 */
  ty = 0;

  /**
   * 检查当前矩阵是否为单位矩阵
   * @readonly
   * @returns 如果是单位矩阵返回 true，否则返回 false
   */
  get isIdentity(): boolean {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
  }

  /**
   * 创建矩阵实例
   * @param a - x 轴缩放分量，默认为 1
   * @param b - y 轴倾斜分量，默认为 0
   * @param c - x 轴倾斜分量，默认为 0
   * @param d - y 轴缩放分量，默认为 1
   * @param tx - x 轴平移分量，默认为 0
   * @param ty - y 轴平移分量，默认为 0
   */
  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.set(a, b, c, d, tx, ty);
  }

  /**
   * 设置当前矩阵的所有分量值
   * @param a - x 轴缩放分量
   * @param b - y 轴倾斜分量
   * @param c - x 轴倾斜分量
   * @param d - y 轴缩放分量
   * @param tx - x 轴平移分量
   * @param ty - y 轴平移分量
   * @returns 当前矩阵实例，支持链式调用
   */
  set(a: number, b: number, c: number, d: number, tx: number, ty: number): this {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;

    return this;
  }

  /**
   * 将坐标点从当前坐标系转换到新的坐标系
   *
   * 例如：从子坐标系转换到世界坐标系
   *
   * @param position - 要转换的坐标点
   * @param out - 输出结果的坐标点，如不提供则创建新的 Point 实例
   * @returns 转换后的坐标点
   */
  apply<P extends IPoint = Point>(position: IPoint, out?: P): P {
    const output = (out || new Point()) as P;

    const x = position.x;
    const y = position.y;

    output.x = this.a * x + this.c * y + this.tx;
    output.y = this.b * x + this.d * y + this.ty;

    return output;
  }

  /**
   * 将坐标点从当前坐标系转换到逆变换坐标系
   *
   * 例如：从世界坐标系转换到子坐标系
   *
   * @param position - 要转换的坐标点
   * @param out - 输出结果的坐标点，如不提供则创建新的 Point 实例
   * @returns 转换后的坐标点
   */
  applyInverse<P extends IPoint = Point>(position: IPoint, out?: P): P {
    const output = (out || new Point()) as P;

    const { a, b, c, d, tx, ty } = this;
    const { x, y } = position;
    const id = 1 / (a * d + c * -b);

    output.x = d * id * x + -c * id * y + (ty * c - tx * d) * id;
    output.y = a * id * y + -b * id * x + (-ty * a + tx * b) * id;

    return output;
  }

  /**
   * 对矩阵进行平移变换
   *
   * 注意事项：
   * - 此操作会修改当前矩阵实例
   *
   * @param x - x 坐标平移量
   * @param y - y 坐标平移量
   * @returns 当前矩阵实例，支持链式调用
   */
  translate(x: number, y: number): this {
    this.tx += x;
    this.ty += y;

    return this;
  }

  /**
   * 对矩阵进行缩放变换
   *
   * 注意事项：
   * - 此操作会修改当前矩阵实例
   * - 缩放为0会导致矩阵不可逆
   *
   * @param x - x 轴缩放比率
   * @param y - y 轴缩放比率
   * @returns 当前矩阵实例，支持链式调用
   */
  scale(x: number, y: number): this {
    this.a *= x;
    this.d *= y;
    this.c *= x;
    this.b *= y;
    this.tx *= x;
    this.ty *= y;

    return this;
  }

  /**
   * 对矩阵进行旋转变换
   *
   * 注意事项：
   * - 此操作会修改当前矩阵实例
   * - 旋转以原点为中心进行
   *
   * @param radian - 旋转的弧度值（正值为逆时针旋转）
   * @returns 当前矩阵实例，支持链式调用
   */
  rotate(radian: number): this {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);

    const a1 = this.a;
    const c1 = this.c;
    const tx1 = this.tx;

    this.a = a1 * cos - this.b * sin;
    this.b = a1 * sin + this.b * cos;
    this.c = c1 * cos - this.d * sin;
    this.d = c1 * sin + this.d * cos;
    this.tx = tx1 * cos - this.ty * sin;
    this.ty = tx1 * sin + this.ty * cos;

    return this;
  }

  /**
   * 将给定的矩阵附加到（右乘）当前矩阵
   *
   * 计算公式：this = this × matrix
   *
   * 注意事项：
   * - 此操作会修改当前矩阵实例
   * - 矩阵乘法不满足交换律，顺序很重要
   *
   * @param matrix - 要附加的矩阵
   * @returns 当前矩阵实例，支持链式调用
   */
  append(matrix: Matrix): this {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;

    this.a = matrix.a * a1 + matrix.b * c1;
    this.b = matrix.a * b1 + matrix.b * d1;
    this.c = matrix.c * a1 + matrix.d * c1;
    this.d = matrix.c * b1 + matrix.d * d1;

    this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
    this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;

    return this;
  }

  /**
   * 将给定的矩阵前置到（左乘）当前矩阵
   *
   * 计算公式：this = matrix × this
   *
   * 注意事项：
   * - 此操作会修改当前矩阵实例
   * - 矩阵乘法不满足交换律，顺序很重要
   *
   * @param matrix - 要前置的矩阵
   * @returns 当前矩阵实例，支持链式调用
   */
  prepend(matrix: Matrix): this {
    const tx1 = this.tx;

    if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
      const a1 = this.a;
      const c1 = this.c;

      this.a = a1 * matrix.a + this.b * matrix.c;
      this.b = a1 * matrix.b + this.b * matrix.d;
      this.c = c1 * matrix.a + this.d * matrix.c;
      this.d = c1 * matrix.b + this.d * matrix.d;
    }

    this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx;
    this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty;

    return this;
  }

  /**
   * 分解矩阵信息为位置、缩放和旋转
   *
   * 注意事项：
   * - 复杂的变换组合可能导致分解结果不够精确
   * - 倾斜变换会影响分解的准确性
   *
   * @param transform - 变换对象，用于获取轴心点信息
   * @returns 包含位置、缩放和旋转信息的对象
   */
  decompose(transform: Transform) {
    const { a, b, c, d } = this;
    const skewX = -Math.atan2(-c, d);
    const skewY = Math.atan2(b, a);
    const delta = Math.abs(skewX + skewY);

    let rotation = 0;
    if (delta < 0.00001 || Math.abs(PI2 - delta) < 0.00001) {
      rotation = Math.abs(skewY) < 0.00001 ? 0 : skewY;
    } else {
      rotation = 0;
    }

    const scale = { x: 1, y: 1 };
    scale.x = Math.sqrt(a * a + b * b);
    scale.y = Math.sqrt(c * c + d * d);

    const position = { x: 0, y: 0 };
    const pivot = transform.pivot;
    position.x = this.tx + (pivot.x * a + pivot.y * c);
    position.y = this.ty + (pivot.x * b + pivot.y * d);

    return { position, scale, rotation };
  }

  /**
   * 计算矩阵的逆矩阵，并应用到当前矩阵
   *
   * 注意事项：
   * - 此操作会修改当前矩阵实例
   * - 如果矩阵不可逆（行列式为0），结果可能不正确
   *
   * @returns 当前矩阵实例，支持链式调用
   */
  invert(): this {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;
    const tx1 = this.tx;
    const n = a1 * d1 - b1 * c1;

    this.a = d1 / n;
    this.b = -b1 / n;
    this.c = -c1 / n;
    this.d = a1 / n;
    this.tx = (c1 * this.ty - d1 * tx1) / n;
    this.ty = -(a1 * this.ty - b1 * tx1) / n;

    return this;
  }

  /**
   * 重置为单位矩阵，单位矩阵不会对坐标产生任何变换
   *
   * @returns 当前矩阵实例，支持链式调用
   */
  identity(): this {
    this.set(1, 0, 0, 1, 0, 0);
    return this;
  }

  /**
   * 将给定矩阵的内容复制到当前矩阵
   *
   * 注意事项：
   * - 此操作会完全覆盖当前矩阵的所有分量
   *
   * @param matrix - 要复制的源矩阵
   * @returns 当前矩阵实例，支持链式调用
   */
  copyFrom(matrix: Matrix): this {
    this.set(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
    return this;
  }

  /**
   * 克隆当前矩阵，返回新的矩阵实例
   *
   * 注意事项：
   * - 返回的是深拷贝，修改克隆矩阵不会影响原矩阵
   *
   * @returns 新的矩阵实例，包含相同的变换信息
   */
  clone(): Matrix {
    return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
  }
}

const tempMatrix = new Matrix();
const identityMatrix = new Matrix();
