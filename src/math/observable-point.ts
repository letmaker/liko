import { DirtyType } from '../const';
import type { IPoint } from './point';

export interface Observer {
  markDirty: (type: DirtyType) => void;
}

/**
 * 可观察的二维坐标点类，当坐标值发生变化时会自动触发 markDirty 回调
 *
 * @remarks
 * 该类主要用于监听和追踪坐标点的变化，常用于需要实时更新变换的场景。大部分情况下，使用 Point 类即可满足需求。
 */
export class ObservablePoint {
  private readonly _observer: Observer;

  /** @internal */
  _x = 0;
  /** @internal */
  _y = 0;

  /**
   * x 轴坐标值
   *
   * @remarks
   * 获取或设置 x 轴坐标。设置新值时，如果值发生变化会自动触发观察者的 markDirty 回调，
   * 传入 DirtyType.transform 参数表示变换需要更新。
   */
  get x(): number {
    return this._x;
  }

  set x(value: number) {
    if (this._x !== value) {
      this._x = value;
      this._observer.markDirty(DirtyType.transform);
    }
  }

  /**
   * y 轴坐标值
   *
   * @remarks
   * 获取或设置 y 轴坐标。设置新值时，如果值发生变化会自动触发观察者的 markDirty 回调，
   * 传入 DirtyType.transform 参数表示变换需要更新。
   */
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
   *
   * @param observer - 观察者对象，必须实现 markDirty 方法用于接收坐标变化的通知
   * @param x - x 轴坐标值，默认为 0
   * @param y - y 轴坐标值，默认为 0
   *
   * @remarks
   * 观察者对象是必需的，它会在坐标发生任何变化时收到通知。
   * 初始坐标值的设置不会触发 markDirty 回调。
   */
  constructor(observer: Observer, x = 0, y = 0) {
    this._x = x;
    this._y = y;
    this._observer = observer;
  }

  /**
   * 批量设置坐标点的位置
   *
   * @param x - x 轴坐标值，默认为 0
   * @param y - y 轴坐标值，如果不提供则使用 x 的值
   * @returns 当前实例，支持链式调用
   *
   * @remarks
   * 这是批量设置坐标的推荐方法，只有当至少一个坐标值发生变化时才会触发 markDirty 回调。
   * 如果两个坐标都没有变化，则不会触发回调，避免不必要的更新。
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
   * 将当前点与另一个点相加
   * @param point - 相加的点
   * @returns 当前实例，支持链式调用
   */
  add(point: IPoint): this {
    this._x += point.x;
    this._y += point.y;
    this._observer.markDirty(DirtyType.transform);
    return this;
  }

  /**
   * 从当前点减去另一个点
   * @param point - 被减去的点
   * @returns 当前实例，支持链式调用
   */
  sub(point: IPoint): this {
    this._x -= point.x;
    this._y -= point.y;
    this._observer.markDirty(DirtyType.transform);
    return this;
  }

  /**
   * 将当前点乘以一个标量
   * @param scalar - 乘数
   * @returns 当前实例，支持链式调用
   */
  multiply(scalar: number): this {
    this._x *= scalar;
    this._y *= scalar;
    this._observer.markDirty(DirtyType.transform);
    return this;
  }

  /**
   * 比较当前坐标点与给定坐标点是否完全相同
   *
   * @param point - 待比较的坐标点对象，必须包含 x 和 y 属性
   * @returns 如果两点的 x 和 y 坐标都相等则返回 true，否则返回 false
   *
   * @remarks
   * 此方法执行严格相等比较（===），不会触发任何坐标变化回调。
   */
  equals(point: IPoint): boolean {
    return point.x === this._x && point.y === this._y;
  }

  /**
   * 从指定坐标点复制坐标值到当前实例
   *
   * @param point - 源坐标点对象，必须包含 x 和 y 属性
   * @returns 当前实例，支持链式调用
   *
   * @remarks
   * 只有当源坐标与当前坐标不同时才会更新并触发 markDirty 回调。
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
   * 创建当前坐标点的完整副本
   *
   * @param observer - 可选的新观察者对象，如果不提供则使用当前实例的观察者
   * @returns 新的 ObservablePoint 实例，包含相同的坐标值
   *
   * @remarks
   * 新创建的实例是完全独立的，修改其中一个不会影响另一个。
   * 如果提供新的观察者，副本将使用新观察者；否则共享相同的观察者对象。
   * 复制过程中不会触发任何 markDirty 回调。
   */
  clone(observer?: Observer): ObservablePoint {
    return new ObservablePoint(observer ?? this._observer, this._x, this._y);
  }
}
