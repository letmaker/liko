import { DirtyType } from "../const";
import type { Matrix } from "./matrix";
import { ObservablePoint } from "./observable-point";
import type { IPoint } from "./point";

/** 变换选项接口 */
export interface ITransformOptions {
  /** 变换状态观察者 */
  observer?: { markDirty: (type: number) => void };
}

/**
 * 2D 变换类，用于处理对象的缩放、旋转和位移等变换操作
 */
export class Transform {
  /** 全局临时变换对象，用于复用以减少对象创建 */
  static readonly TEMP = new Transform();

  /** 对象的 x 轴和 y 轴缩放值 */
  scale: ObservablePoint = new ObservablePoint(this, 1, 1);
  /** 对象的变换轴心点坐标 */
  pivot: ObservablePoint = new ObservablePoint(this, 0, 0);

  private _observer?: { markDirty: (type: DirtyType) => void };
  private _rotation = 0;
  private _cx = 1;
  private _sx = 0;

  /** 对象的旋转值（单位：弧度） */
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
   * 将当前变换信息应用到指定矩阵
   * @param matrix - 目标矩阵
   * @param position - 位置坐标
   * @returns 返回应用变换后的矩阵
   */
  getMatrix(matrix: Matrix, position: IPoint): Matrix {
    const lt = matrix;
    const { scale, pivot } = this;

    lt.a = this._cx * scale._x;
    lt.b = this._sx * scale._x;
    lt.c = -this._sx * scale._y;
    lt.d = this._cx * scale._y;

    lt.tx = position.x - (pivot._x * lt.a + pivot._y * lt.c);
    lt.ty = position.y - (pivot._x * lt.b + pivot._y * lt.d);

    return lt;
  }

  /**
   * 更新局部和世界变换矩阵
   * @param local - 局部变换矩阵
   * @param world - 世界变换矩阵
   * @param position - 位置坐标
   * @param parent - 父级变换矩阵
   */
  updateMatrix(local: Matrix, world: Matrix, position: IPoint, parent: Matrix): void {
    const { _cx, _sx } = this;
    const { _x, _y } = this.scale;
    const { _x: px, _y: py } = this.pivot;

    const la = _cx * _x;
    const lb = _sx * _x;
    const lc = -_sx * _y;
    const ld = _cx * _y;
    const ltx = position.x - (px * la + py * lc);
    const lty = position.y - (px * lb + py * ld);
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
   * 标记变换状态为脏
   * 当对象的缩放、轴心点、旋转等属性发生变化时调用此方法
   */
  markDirty(): void {
    this._observer?.markDirty(DirtyType.transform);
  }
}
