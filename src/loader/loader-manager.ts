import { EventType } from "../const";
import { Dispatcher } from "../utils/dispatcher";

/** 定义资源加载器的接口规范 */
export interface ILoader {
  /** 判断加载器是否支持指定的资源类型 */
  test: (type: string) => boolean;
  /** 执行资源加载操作 */
  load: (url: string, manager: LoaderManager) => Promise<any>;
}

/** 资源加载管理器，负责资源的加载、缓存和事件分发 */
export class LoaderManager extends Dispatcher {
  private static _loaders: ILoader[] = [];

  /**
   * 注册一个新的资源加载器
   * @param loader - 实现了 ILoader 接口的加载器实例
   */
  static regLoader(loader: ILoader) {
    LoaderManager._loaders.push(loader);
  }

  private _loadingMap: Record<string, Promise<any>> = {};
  /** 存储已加载资源的缓存映射表 */
  cacheMap: Record<string, any> = {};

  private _total = 0;
  /** 待加载的资源总数 */
  get total(): number {
    return this._total;
  }

  private _loaded = 0;
  /** 已完成加载的资源数量 */
  get loaded(): number {
    return this._loaded;
  }

  /** 当前正在加载中的资源数量 */
  get loadingCount(): number {
    return this._total - this._loaded;
  }

  /**
   * 加载指定的资源
   * @param url - 资源的URL地址
   * @param type - 可选的资源类型，若未指定则根据URL后缀自动判断
   * @returns 返回加载完成的资源，加载失败时返回undefined
   */
  load<T>(url: string, type?: string): Promise<T | undefined> {
    // 如果有缓存，则优先从缓存获取
    const res = this.get(url);
    if (res) return Promise.resolve(res);

    // 同一个 url 只会加载一次
    const promise = this._loadingMap[url];
    if (promise) return promise;

    this._total++;
    const resType = type ?? this._getTypeByExt(url);
    const resLoader = LoaderManager._loaders.find((loader) => loader.test(resType));

    // 找不到合适的加载器
    if (!resLoader) {
      this._error("no loader can load:", url);
      return Promise.resolve(undefined);
    }

    // 开始加载
    const newPromise = new Promise<T | undefined>((resolve) => {
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
   * 将资源存入缓存
   * @param url - 资源的URL地址
   * @param res - 要缓存的资源对象
   */
  cache(url: string, res: unknown) {
    if (res !== undefined) this.cacheMap[url] = res;
  }

  /**
   * 从缓存中获取资源
   * @param url - 资源的URL地址
   * @returns 返回缓存的资源，如果不存在则返回undefined
   */
  get(url: string) {
    return this.cacheMap[url];
  }

  /**
   * 卸载并释放相关资源
   * @param url - 要卸载的资源URL地址
   */
  unload(url: string) {
    const res = this.cacheMap[url];
    delete this.cacheMap[url];
    if (res) {
      if (typeof res.destroy === "function") res.destroy();
      if (typeof res.dispose === "function") res.dispose();
    }
  }

  /**
   * 清空所有已缓存的资源并重置加载状态
   */
  clear() {
    for (const url of Object.keys(this.cacheMap)) {
      this.unload(url);
    }
    this._loadingMap = {};
    this._total = 0;
    this._loaded = 0;
  }

  /**
   * 重置加载计数器，用于重新开始加载进度的计算
   */
  resetCount() {
    this._total -= this._loaded;
    this._loaded = 0;
  }
}
