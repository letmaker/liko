import { Bounds } from "../../math/bounds";
import { RotatingRect } from "../../math/rotating-rect";
import type { Node } from "../../nodes/node";

export class NodeCache<T> {
  static gloBounds = new NodeCache(Bounds);
  static rotatingRect = new NodeCache(RotatingRect);

  private _cache: Map<any, any> = new Map();
  private _Class;

  constructor(Class: new () => T) {
    this._Class = Class;
  }

  get(key: Node): T {
    let res = this._cache.get(key);
    if (res === undefined) {
      res = new this._Class();
      this._cache.set(key, res);
    }
    return res;
  }

  has(key: Node): boolean {
    return this._cache.has(key);
  }
}
