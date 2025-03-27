import { PI2 } from "../const";
import { type IPoint, Point } from "./point";
import type { Transform } from "./transform";

/**
 * 2D 矩阵类
 * ```js
 * | a | c | tx|
 * | b | d | ty|
 * | 0 | 0 | 1 |
 * ```
 */
export class Matrix {
  /** 全局单位矩阵 */
  static get IDENTITY(): Readonly<Matrix> {
    return identityMatrix.identity();
  }

  /** 全局临时对象，方便复用，以减少对象创建（获取时自动重置为单位矩阵） */
  static get TEMP(): Matrix {
    return tempMatrix.identity();
  }

  /** @default 1 */
  a = 1;
  /** @default 0 */
  b = 0;
  /** @default 0 */
  c = 0;
  /** @default 1 */
  d = 1;
  /** @default 0 */
  tx = 0;
  /** @default 0 */
  ty = 0;

  /** 是否为单位矩阵 */
  get isIdentity(): boolean {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
  }

  /**
   * 矩阵
   * @param a x轴缩放
   * @param b y轴倾斜
   * @param c x轴倾斜
   * @param d y轴缩放
   * @param tx x轴平移
   * @param ty y轴平移
   */
  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.set(a, b, c, d, tx, ty);
  }

  /**
   * 设置当前矩阵
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
   * 把指定坐标点，转换到新的坐标系，比如从子坐标系转到世界坐标系
   * @param pos 指定坐标点
   * @param out 返回值，方便复用
   * @returns 返回 out
   */
  apply<P extends IPoint = Point>(pos: IPoint, out?: P): P {
    const output = (out || new Point()) as P;

    const x = pos.x;
    const y = pos.y;

    output.x = this.a * x + this.c * y + this.tx;
    output.y = this.b * x + this.d * y + this.ty;

    return output;
  }

  /**
   * 把指定坐标点，转换到逆变换坐标系，比如从世界系转到子坐标系
   * @param pos 指定坐标点
   * @param out 返回值，方便复用
   * @returns 返回 out
   */
  applyInverse<P extends IPoint = Point>(pos: IPoint, out?: P): P {
    const output = (out || new Point()) as P;

    const { a, b, c, d, tx, ty } = this;
    const { x, y } = pos;
    const id = 1 / (a * d + c * -b);

    output.x = d * id * x + -c * id * y + (ty * c - tx * d) * id;
    output.y = a * id * y + -b * id * x + (-ty * a + tx * b) * id;

    return output;
  }

  /**
   * 平移矩阵
   * @param x x 坐标平铺量
   * @param y y 坐标平移量
   */
  translate(x: number, y: number): this {
    this.tx += x;
    this.ty += y;

    return this;
  }

  /**
   * 缩放矩阵
   * @param x x 轴缩放比率
   * @param y y 轴缩放比率
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
   * 旋转矩阵
   * @param radian 旋转的弧度
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
   * 将给定的矩阵，附加到（乘以）当前矩阵
   * @param matrix 附加的矩阵
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
   * 把给定的矩阵，附加到当前矩阵之前
   * @param matrix 给定的矩阵
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
   * 分解矩阵信息
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

    const pos = { x: 0, y: 0 };
    const pivot = transform.pivot;
    pos.x = this.tx + (pivot.x * a + pivot.y * c);
    pos.y = this.ty + (pivot.x * b + pivot.y * d);

    return { pos, scale, rotation };
  }

  /**
   * 翻转矩阵
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
   * 重置为单位矩阵
   */
  identity(): this {
    this.set(1, 0, 0, 1, 0, 0);
    return this;
  }

  /**
   * 把给定矩阵内容 copy 到当前矩阵内
   * @param matrix 给定的矩阵
   */
  copyFrom(matrix: Matrix): this {
    this.set(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
    return this;
  }

  /**
   * clone 当前矩阵，返回新矩阵
   */
  clone(): Matrix {
    return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
  }
}

const tempMatrix = new Matrix();
const identityMatrix = new Matrix();
