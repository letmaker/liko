import { DirtyType } from "../const";
import type { IPoint } from "./point";

export interface Observer {
  onDirty: (type: DirtyType) => void;
}

/**
 * 坐标位置发生变化时，会触发 onDirty 回调
 */
export class ObservablePoint {
  private readonly _observer: Observer;

  /** @internal */
  _x = 0;
  /** @internal */
  _y = 0;

  /** 设置 x 坐标，会触发 onDirty 更新 */
  get x(): number {
    return this._x;
  }

  set x(value: number) {
    if (this._x !== value) {
      this._x = value;
      this._observer.onDirty(DirtyType.transform);
    }
  }

  /** 设置 y 坐标，会触发 onDirty 更新 */
  get y(): number {
    return this._y;
  }

  set y(value: number) {
    if (this._y !== value) {
      this._y = value;
      this._observer.onDirty(DirtyType.transform);
    }
  }

  constructor(observer: Observer, x = 0, y = 0) {
    this._x = x;
    this._y = y;
    this._observer = observer;
  }

  /**
   * 设置坐标点
   * @param x x 坐标点
   * @param y y 坐标点，不设置则等于 x
   */
  set(x = 0, y = x): this {
    if (this._x !== x || this._y !== y) {
      this._x = x;
      this._y = y;
      this._observer.onDirty(DirtyType.transform);
    }
    return this;
  }

  /**
   * 添加增量值
   * @param dx  x 增量
   * @param dy  y 增量
   */
  add(dx: number, dy: number): this {
    this._x += dx;
    this._y += dy;
    this._observer.onDirty(DirtyType.transform);
    return this;
  }

  /**
   * 比较两个坐标点是否相同
   * @param point 给定的坐标点
   * @returns 是否相同
   */
  equals(point: IPoint): boolean {
    return point.x === this._x && point.y === this._y;
  }

  /**
   * 把指定的坐标点 copy 到当前坐标
   * @param point 指定的坐标点
   * @returns 返回当前坐标本身
   */
  copyFrom(point: IPoint): this {
    if (this._x !== point.x || this._y !== point.y) {
      this._x = point.x;
      this._y = point.y;
      this._observer.onDirty(DirtyType.transform);
    }
    return this;
  }

  /**
   * clone 当前坐标点，返回新的坐标对象
   */
  clone(observer?: Observer): ObservablePoint {
    return new ObservablePoint(observer ?? this._observer, this._x, this._y);
  }
}
