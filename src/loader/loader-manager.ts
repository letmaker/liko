import { EventType } from '../const';
import { Dispatcher } from '../utils/dispatcher';

/**
 * 定义资源加载器的接口规范
 */
export interface ILoader {
  /**
   * 判断加载器是否支持指定的资源类型
   * @param type - 资源类型
   * @returns 是否支持处理该类型
   */
  test: (type: string) => boolean;
  /**
   * 执行资源加载操作
   * @param url - 资源的 URL 地址
   * @param manager - 加载管理器实例
   * @returns 加载完成的资源
   */
  load: (url: string, manager: LoaderManager) => Promise<any>;
}

/**
 * 资源加载管理器，负责资源的加载、缓存和事件分发
 *
 * 该类提供统一的资源加载接口，支持多种资源类型的加载器注册，
 * 内置资源缓存机制和加载进度追踪，通过事件系统通知加载状态变化。
 *
 * 支持的事件类型：
 * - EventType.progress: 加载进度更新 (参数: progress: number)
 * - EventType.loaded: 单个资源加载完成 (参数: url: string, resource: any)
 * - EventType.error: 资源加载失败 (参数: url: string, error: string)
 * - EventType.complete: 所有资源加载完成
 *
 * @example
 * ```typescript
 * // 注册自定义加载器
 * LoaderManager.regLoader({
 *   test: (type) => type === 'json',
 *   load: async (url) => {
 *     const response = await fetch(url);
 *     return response.json();
 *   }
 * });
 *
 * // 监听加载事件
 * loader.on(EventType.progress, (progress) => {
 *   console.log(`加载进度: ${Math.round(progress * 100)}%`);
 * });
 *
 * loader.on(EventType.complete, () => {
 *   console.log('所有资源加载完成');
 * });
 *
 * // 加载资源
 * const texture = await loader.load<Texture>('/assets/sprite.png');
 * const data = await loader.load<any>('/data/config.json');
 *
 * // 批量加载
 * const promises = [
 *   loader.load('/assets/bg.jpg'),
 *   loader.load('/sounds/music.mp3'),
 *   loader.load('/data/levels.json')
 * ];
 * await Promise.all(promises);
 * ```
 */
export class LoaderManager extends Dispatcher {
  private static _loaders: ILoader[] = [];

  /**
   * 注册一个新的资源加载器
   *
   * 注意事项：
   * - 加载器按注册顺序进行测试，建议将更具体的加载器放在前面
   * - 同一类型可以注册多个加载器，会使用第一个匹配的加载器
   * - 加载器应该确保 test 方法的准确性，避免误匹配
   *
   * @param loader - 实现了 ILoader 接口的加载器实例
   */
  static regLoader(loader: ILoader) {
    LoaderManager._loaders.push(loader);
  }

  private _loadingMap: Record<string, Promise<any>> = {};

  /**
   * 存储已加载资源的缓存映射表
   *
   * 注意事项：
   * - 直接修改此对象可能导致缓存不一致，建议使用 cache() 和 get() 方法
   * - 大量缓存可能占用内存，适时使用 unload() 或 clear() 清理
   */
  cacheMap: Record<string, any> = {};

  private _total = 0;

  /**
   * 待加载的资源总数
   *
   * 该数值在调用 load() 方法时自动递增，用于计算加载进度。
   * 可以通过 resetCount() 方法重置计数器。
   */
  get total(): number {
    return this._total;
  }

  private _loaded = 0;

  /**
   * 已完成加载的资源数量
   *
   * 包括成功加载和加载失败的资源数量，用于计算加载进度。
   */
  get loaded(): number {
    return this._loaded;
  }

  /**
   * 当前正在加载中的资源数量
   *
   * 计算公式：total - loaded
   */
  get loadingCount(): number {
    return this._total - this._loaded;
  }

  /**
   * 加载指定的资源
   *
   * 该方法会自动处理资源缓存、重复加载防护和加载进度统计。
   *
   * 注意事项：
   * - 相同 URL 的资源只会加载一次，后续调用会返回缓存结果
   * - 如果没有合适的加载器，会返回 undefined 而不是抛出异常
   * - 加载失败时返回 undefined，具体错误通过 error 事件通知
   * - 资源类型自动根据文件扩展名判断，也可手动指定 type 参数
   *
   * @param url - 资源的 URL 地址
   * @param type - 可选的资源类型，若未指定则根据 URL 后缀自动判断
   * @returns 返回加载完成的资源，加载失败时返回 undefined
   * @template T - 资源类型
   */
  load<T>(url: string, type?: string): Promise<T | undefined> {
    // TODO: 是否需要增加一个资源加载的优先级

    // 如果有缓存，则优先从缓存获取
    const res = this.get(url);
    if (res) return Promise.resolve(res as T);

    // 同一个 url 只会加载一次
    const promise = this._loadingMap[url];
    if (promise) return promise;

    this._total++;
    const resType = type ?? this._getTypeByExt(url);
    const resLoader = LoaderManager._loaders.find((loader) => loader.test(resType));

    // 找不到合适的加载器
    if (!resLoader) {
      this._error('no loader can load:', url);
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
    let ext = url.substring(url.lastIndexOf('.') + 1);
    if (ext.indexOf('?') !== -1) ext = ext.substring(0, ext.lastIndexOf('?'));
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
    // 和直接 throw 相比，哪个更好：console.error 允许程序继续执行，适合非致命性错误，资源加载失败通常不应该中断整个游戏进程
    console.error('Failed to load url:', url, 'Error:', error);
    delete this._loadingMap[url];
    this._loaded++;
    this.emit(EventType.error, url, error);
  }

  /**
   * 将资源存入缓存
   *
   * 注意事项：
   * - 只有当资源不为 undefined 时才会存入缓存
   * - 重复缓存同一 URL 会覆盖之前的资源
   * - 缓存的资源会一直占用内存直到被 unload() 或 clear()
   *
   * @param url - 资源的 URL 地址
   * @param res - 要缓存的资源对象
   */
  cache(url: string, res: unknown): void {
    if (res !== undefined) this.cacheMap[url] = res;
  }

  /**
   * 从缓存中获取资源
   *
   * @param url - 资源的 URL 地址
   * @returns 返回缓存的资源，如果不存在则返回 undefined
   * @template T - 期望的资源类型
   */
  get<T>(url: string): T | undefined {
    return this.cacheMap[url] as T | undefined;
  }

  /**
   * 卸载并释放相关资源
   *
   * 该方法会尝试调用资源的 destroy() 或 dispose() 方法进行清理，
   * 然后从缓存中移除该资源。
   *
   * 注意事项：
   * - 卸载后的资源无法再次获取，需要重新加载
   * - 如果资源正在被使用，卸载可能导致错误
   * - 支持自动调用资源的清理方法（destroy/dispose）
   *
   * @param url - 要卸载的资源 URL 地址
   */
  unload(url: string): void {
    const res = this.cacheMap[url];
    delete this.cacheMap[url];
    if (res) {
      if (typeof res.destroy === 'function') res.destroy();
      if (typeof res.dispose === 'function') res.dispose();
    }
  }

  /**
   * 清空所有已缓存的资源并重置加载状态
   *
   * 该方法会：
   * 1. 卸载所有缓存的资源（调用各自的清理方法）
   * 2. 清空正在加载的资源映射表
   * 3. 重置加载计数器
   *
   * 注意事项：
   * - 清空后所有资源都需要重新加载
   * - 正在进行的加载操作不会被中断，但结果不会被缓存
   * - 适合在场景切换或内存清理时使用
   */
  clear(): void {
    for (const url of Object.keys(this.cacheMap)) {
      this.unload(url);
    }
    this._loadingMap = {};
    this._total = 0;
    this._loaded = 0;
  }

  /**
   * 重置加载计数器，用于重新开始加载进度的计算
   *
   * 该方法会将 total 计数器减去已加载的数量，并将 loaded 重置为 0，
   * 适合在需要重新计算加载进度时使用。
   *
   * 注意事项：
   * - 不会影响已缓存的资源
   * - 不会中断正在进行的加载操作
   * - 主要用于进度统计的重置，而非资源管理
   */
  resetCount(): void {
    this._total -= this._loaded;
    this._loaded = 0;
  }
}
