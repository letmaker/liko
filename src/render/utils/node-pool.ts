import { Matrix } from '../../math/matrix';
import { Point } from '../../math/point';

export class NodePool<T> {
  static points = new NodePool(Point);
  static matrix = new NodePool(Matrix);

  private _cache: T[] = [];
  private _Class;

  constructor(Class: new () => T) {
    this._Class = Class;
  }

  get(): T {
    return this._cache.pop() ?? new this._Class();
  }

  release(...instances: T[]) {
    for (const instance of instances) {
      this._cache.push(instance);
    }
  }
}
