import { DirtyType } from '../const';
import type { IPoint } from './point';

export interface Observer {
  markDirty: (type: DirtyType) => void;
}

/**
 * 可观察的二维坐标点类，当坐标值发生变化时会自动触发 markDirty 回调
 * @remarks
 * 该类主要用于监听和追踪坐标点的变化，常用于需要实时更新变换的场景
 */
export class ObservablePoint {
  private readonly _observer: Observer;

  /** @internal */
  _x = 0;
  /** @internal */
  _y = 0;

  /** x 轴坐标值，修改时会触发 transform 类型的脏标记 */
  get x(): number {
    return this._x;
  }

  set x(value: number) {
    if (this._x !== value) {
      this._x = value;
      this._observer.markDirty(DirtyType.transform);
    }
  }

  /** y 轴坐标值，修改时会触发 transform 类型的脏标记 */
  get y(): number {
    return this._y;
  }

  set y(value: number) {
    if (this._y !== value) {
      this._y = value;
      this._observer.markDirty(DirtyType.transform);
    }
  }

  /**
   * 创建一个新的可观察坐标点实例
   * @param observer - 观察者对象，用于接收坐标变化的通知
   * @param x - x 轴坐标值
   * @param y - y 轴坐标值
   */
  constructor(observer: Observer, x = 0, y = 0) {
    this._x = x;
    this._y = y;
    this._observer = observer;
  }

  /**
   * 设置坐标点的位置
   * @param x - x 轴坐标值
   * @param y - y 轴坐标值，不设置则等于 x
   * @returns 当前实例，支持链式调用
   */
  set(x = 0, y = x): this {
    if (this._x !== x || this._y !== y) {
      this._x = x;
      this._y = y;
      this._observer.markDirty(DirtyType.transform);
    }
    return this;
  }

  /**
   * 将坐标点按指定增量进行偏移
   * @param dx - x 轴偏移量
   * @param dy - y 轴偏移量
   * @returns 当前实例，支持链式调用
   */
  add(dx: number, dy: number): this {
    this._x += dx;
    this._y += dy;
    this._observer.markDirty(DirtyType.transform);
    return this;
  }

  /**
   * 比较当前坐标点与给定坐标点是否相同
   * @param point - 待比较的坐标点
   * @returns 两点是否完全重合
   */
  equals(point: IPoint): boolean {
    return point.x === this._x && point.y === this._y;
  }

  /**
   * 从指定坐标点复制坐标值
   * @param point - 源坐标点
   * @returns 当前实例，支持链式调用
   */
  copyFrom(point: IPoint): this {
    if (this._x !== point.x || this._y !== point.y) {
      this._x = point.x;
      this._y = point.y;
      this._observer.markDirty(DirtyType.transform);
    }
    return this;
  }

  /**
   * 创建当前坐标点的副本
   * @param observer - 可选的新观察者对象，默认使用当前观察者
   * @returns 新的可观察坐标点实例
   */
  clone(observer?: Observer): ObservablePoint {
    return new ObservablePoint(observer ?? this._observer, this._x, this._y);
  }
}
