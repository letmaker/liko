import { Dispatcher } from './dispatcher';
import { cloneJson } from './utils';

/**
 * 数据仓库
 */
export class Store extends Dispatcher {
  private _data: Record<string, unknown> = {};

  /**
   * 从json填充数据
   * @param json json数据
   */
  fromJson(json: Record<string, unknown>): void {
    const keys = Object.keys(json);
    for (const key of keys) {
      const value = json[key];
      const type = typeof value;
      if (type !== 'object') this._data[key] = value;
      else this._data[key] = cloneJson(value as Record<string, unknown>);
    }
  }

  /**
   * 获取数据
   * @param key 数据唯一标识
   * @returns 数据内容
   */
  get(key: string): unknown {
    return this._data[key];
  }

  /**
   * 设置数据
   * @param key 数据唯一标识
   * @param value 数据内容
   */
  set(key: string, value: unknown): void {
    if (this._data[key] !== value) {
      this._data[key] = value;
      this.emit('changed', key, value);
    }
  }

  /**
   * 移除数据
   * @param key 数据唯一标识
   */
  remove(key: string): void {
    delete this._data[key];
  }

  /**
   * 清理所有数据
   */
  clear(): void {
    this._data = {};
  }

  /**
   * 销毁数据仓库
   */
  override destroy(): void {
    super.destroy();
    this.clear();
  }
}
