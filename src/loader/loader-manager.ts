import { EventType } from "../const";
import { Dispatcher } from "../utils/dispatcher";

export interface ILoader {
  /** 测试是否使用本加载器 */
  test: (type: string) => boolean;
  /** 加载 */
  load: (url: string, manager: LoaderManager) => Promise<any>;
}

/**
 * 加载管理器
 */
export class LoaderManager extends Dispatcher {
  private static _loaders: ILoader[] = [];
  private _loadingMap: Record<string, Promise<any>> = {};
  cacheMap: Record<string, any> = {};

  private _total = 0;
  /** 所有加载的总数量 */
  get total(): number {
    return this._total;
  }

  private _loaded = 0;
  /** 加载完成的数量 */
  get loaded(): number {
    return this._loaded;
  }

  /** 正在加载中的数量 */
  get loadingCount(): number {
    return this._total - this._loaded;
  }

  /**
   * 加载资源
   * @param url url 地址
   * @param type 类型，可选，如果不设置则根据 url 后缀分析
   * @returns 返回加载后的资源
   */
  load(url: string, type?: string): Promise<any> | any {
    // 如果有缓存，则优先从缓存获取
    const res = this.get(url);
    if (res) return res;

    // 同一个 url 只会加载一次
    const promise = this._loadingMap[url];
    if (promise) return promise;

    this._total++;
    const resType = type ?? this._getTypeByExt(url);
    let resLoader: ILoader | undefined;
    for (const loader of LoaderManager._loaders) {
      if (loader.test(resType)) {
        resLoader = loader;
        break;
      }
    }

    // 找不到合适的加载器
    if (!resLoader) {
      this._error("no loader can load:", url);
      return undefined;
    }

    // 开始加载
    const newPromise = new Promise((resolve) => {
      // TODO: 增加重试机制
      resLoader
        .load(url, this)
        .then((res) => {
          this._complete(url, res);
          resolve(res);
        })
        .catch((e) => {
          this._error(url, e.toString());
          resolve(undefined);
        });
    });
    this._loadingMap[url] = newPromise;

    return newPromise;
  }

  /** 根据后缀获得类型 */
  private _getTypeByExt(url: string): string {
    let ext = url.substring(url.lastIndexOf(".") + 1);
    if (ext.indexOf("?") !== -1) ext = ext.substring(0, ext.lastIndexOf("?"));
    return ext.toLowerCase();
  }

  private _complete(url: string, res: any): void {
    if (res !== undefined) this.cache(url, res);

    // 派发进度事件
    delete this._loadingMap[url];
    this._loaded++;
    const progress = this._total > 0 ? this._loaded / this._total : 1;
    this.emit(EventType.progress, progress);

    // 派发完成事件
    this.emit(EventType.loaded, url, res);
    if (this._loaded >= this._total) {
      this._total = this._loaded;
      // 全部加载完成，派发 complete 事件
      this.emit(EventType.complete);
    }
  }

  private _error(url: string, error: string): void {
    console.error("Failed to load url:", url, "Error:", error);
    delete this._loadingMap[url];
    this._loaded++;
    this.emit(EventType.error, url, error);
  }

  /**
   * 缓存资源
   * @param url 资源路径
   * @param res 资源 url
   */
  cache(url: string, res: unknown) {
    if (res !== undefined) this.cacheMap[url] = res;
  }

  /**
   * 从缓存获取资源
   * @param url 资源路径
   * @returns 缓存的资源
   */
  get(url: string) {
    return this.cacheMap[url];
  }

  /**
   * 删除缓存
   * @param url 资源路径
   */
  unload(url: string) {
    const res = this.cacheMap[url];
    delete this.cacheMap[url];
    if ("destroy" in res) res.destroy();
  }

  /**
   * 重置 loaded 和 total，方便重新计算百分比
   */
  resetCount() {
    this._total -= this._loaded;
    this._loaded = 0;
  }

  /**
   * 注册加载器
   * @param loader 加载器实例 // TODO: 会不会有并发问题
   */
  static regLoader(loader: ILoader) {
    LoaderManager._loaders.push(loader);
  }
}
