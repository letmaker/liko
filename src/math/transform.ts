import { DirtyType } from "../const";
import type { Matrix } from "./matrix";
import { ObservablePoint } from "./observable-point";
import type { IPoint } from "./point";

export interface ITransformOptions {
  observer?: { markDirty: (type: number) => void };
}

/**
 * 变换
 */
export class Transform {
  /** 全局临时对象，方便复用，以减少对象创建 */
  static readonly TEMP = new Transform();

  /** 对象的缩放值 */
  scale: ObservablePoint = new ObservablePoint(this, 1, 1);
  /** 对象的轴心点 */
  pivot: ObservablePoint = new ObservablePoint(this, 0, 0);

  private _observer?: { markDirty: (type: DirtyType) => void };
  private _rotation = 0;
  private _cx = 1;
  private _sx = 0;

  /** 对象的旋转值（单位为弧度） */
  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    if (this._rotation !== value) {
      this._rotation = value;

      this._cx = Math.cos(value);
      this._sx = Math.sin(value);

      this.markDirty();
    }
  }

  constructor({ observer }: ITransformOptions = {}) {
    this._observer = observer;
  }

  /**
   * 把当前变换信息设置到指定的矩阵
   * @param matrix 指定的矩阵
   * @param pos 位置坐标
   * @returns 返回指定的矩阵
   */
  getMatrix(matrix: Matrix, pos: IPoint): Matrix {
    const lt = matrix;
    const { scale, pivot } = this;

    lt.a = this._cx * scale._x;
    lt.b = this._sx * scale._x;
    lt.c = -this._sx * scale._y;
    lt.d = this._cx * scale._y;

    lt.tx = pos.x - (pivot._x * lt.a + pivot._y * lt.c);
    lt.ty = pos.y - (pivot._x * lt.b + pivot._y * lt.d);

    return lt;
  }

  updateMatrix(local: Matrix, world: Matrix, pos: IPoint, parent: Matrix): void {
    const { _cx, _sx } = this;
    const { _x, _y } = this.scale;
    const { _x: px, _y: py } = this.pivot;

    const la = _cx * _x;
    const lb = _sx * _x;
    const lc = -_sx * _y;
    const ld = _cx * _y;
    const ltx = pos.x - (px * la + py * lc);
    const lty = pos.y - (px * lb + py * ld);
    local.set(la, lb, lc, ld, ltx, lty);

    const { a, b, c, d } = parent;
    world.a = la * a + lb * c;
    world.b = la * b + lb * d;
    world.c = lc * a + ld * c;
    world.d = lc * b + ld * d;
    world.tx = ltx * a + lty * c + parent.tx;
    world.ty = ltx * b + lty * d + parent.ty;
  }

  /**
   * 当缩放值、轴心点、倾斜值、旋转值发生变化后，会调用此回调
   */
  markDirty(): void {
    this._observer?.markDirty(DirtyType.transform);
  }
}
