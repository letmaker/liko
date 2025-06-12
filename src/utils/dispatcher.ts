/**
 * 事件处理器类，用于封装回调函数及其执行环境
 */
export class Handler {
  private _destroyed = false;

  /**
   * 创建事件处理器
   * @param callback - 回调函数，支持任意参数
   * @param caller - 回调函数执行上下文，决定函数内this的指向
   * @param once - 是否只执行一次，执行后自动销毁，默认为false
   */
  constructor(
    public callback?: (...args: unknown[]) => void,
    public caller?: unknown,
    public once = false
  ) {}

  /**
   * 销毁事件处理器，销毁后不可再用
   * 清理所有引用，防止内存泄漏
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.callback = undefined;
      this.caller = undefined;
    }
  }

  /**
   * 检查处理器是否已被销毁
   * @returns 如果已销毁返回true，否则返回false
   */
  get destroyed(): boolean {
    return this._destroyed;
  }

  /**
   * 执行回调函数
   * @param args - 传递给回调函数的参数数组
   */
  run(args?: unknown[]) {
    if (this.callback) {
      if (args?.length) this.callback.call(this.caller, ...args);
      else this.callback.call(this.caller);
      if (this.once) this.destroy();
    }
  }
}

/**
 * 事件管理器，用于管理事件的注册、触发和销毁
 * 支持多种事件监听模式：普通监听、一次性监听、批量取消等
 *
 * @example
 * ```typescript
 * const dispatcher = new Dispatcher();
 *
 * // 注册事件监听
 * dispatcher.on('test', (data) => console.log('接收到:', data), this);
 *
 * // 注册一次性监听
 * dispatcher.once('init', () => console.log('初始化完成'));
 *
 * // 触发事件
 * dispatcher.emit('test', 'hello world');
 *
 * // 检查是否有监听器
 * if (dispatcher.hasListener('test')) {
 *   console.log('存在test事件的监听器');
 * }
 *
 * // 取消特定监听
 * dispatcher.off('test', callback, this);
 *
 * // 取消所有监听
 * dispatcher.offAll();
 *
 * // 销毁管理器
 * dispatcher.destroy();
 * ```
 *
 * @注意事项
 * - 事件类型不区分大小写，'Test'和'test'被视为同一事件
 * - 多次注册同一监听器只生效最后一次（会先取消之前的注册）
 * - 事件派发期间新增的同类型事件监听器不会收到当前事件通知
 * - once监听器执行后会自动从监听列表中移除
 */
export class Dispatcher {
  private _events: Record<string, Handler[]> = {};

  /**
   * 注册事件监听器
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数，接收事件参数
   * @param caller - 回调函数执行上下文，决定函数内this的指向
   *
   * @注意事项
   * - 多次注册相同的监听器只生效最后一次
   * - 会先自动取消之前的注册，避免重复监听
   */
  on(type: string, listener: (...args: unknown[]) => void, caller?: unknown): void {
    this._addListener(type, listener, caller, false);
  }

  /**
   * 注册一次性事件监听器，事件被执行后自动取消监听
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数，接收事件参数
   * @param caller - 回调函数执行上下文，决定函数内this的指向
   *
   * @注意事项
   * - 监听器只会执行一次，执行后自动销毁
   * - 多次注册相同的监听器只生效最后一次
   */
  once(type: string, listener: (...args: unknown[]) => void, caller?: unknown): void {
    this._addListener(type, listener, caller, true);
  }

  /**
   * 添加事件监听器的内部方法
   * @param type - 事件类型
   * @param listener - 回调函数
   * @param caller - 回调函数执行上下文
   * @param once - 是否只执行一次
   */
  private _addListener(type: string, listener: (...args: unknown[]) => void, caller: unknown, once: boolean): void {
    const events = this._events;
    const lowerType = type.toLowerCase();
    // 禁止重复注册
    if (events[lowerType]) this.off(lowerType, listener, caller);

    const handler = new Handler(listener, caller || this, once);
    if (!events[lowerType]) events[lowerType] = [handler];
    else events[lowerType].push(handler);
  }

  /**
   * 取消事件监听
   * @param type - 事件类型，不区分大小写
   * @param listener - 要取消的回调函数，如果为空则删除该类型的所有事件监听
   * @param caller - 回调函数执行上下文，用于精确匹配要取消的监听器
   *
   * @注意事项
   * - 如果不提供listener参数，会删除该事件类型的所有监听器
   * - caller参数用于区分相同函数但不同上下文的监听器
   */
  off(type: string, listener?: (...args: unknown[]) => void, caller?: unknown): void {
    const handlers = this._events[type.toLowerCase()];
    if (!handlers || handlers.length === 0) return;
    if (listener === undefined) {
      handlers.length = 0;
      return;
    }

    for (let i = handlers.length - 1; i > -1; i--) {
      const handler = handlers[i];
      if (handler.callback === listener && (!caller || handler.caller === caller)) {
        handlers.splice(i, 1);
        handler.destroy();
      }
    }
  }

  /**
   * 取消特定上下文的所有事件监听
   * @param caller - 函数上下文，如果为空则清空所有事件监听
   *
   * @注意事项
   * - 不提供caller参数会清空所有事件监听
   * - 提供caller参数只会清空该上下文下的所有监听器
   */
  offAll(caller?: unknown): void {
    if (!caller) {
      this._events = {};
    } else {
      const values = Object.values(this._events);
      for (const handlers of values) {
        for (let i = handlers.length - 1; i > -1; i--) {
          const handler = handlers[i];
          if (handler.caller === caller) {
            handlers.splice(i, 1);
            handler.destroy();
          }
        }
      }
    }
  }

  /**
   * 派发事件，通知所有监听该事件的处理器
   * @param type - 事件类型，不区分大小写
   * @param args - 传递给监听器的参数，支持任意数量和类型的参数
   *
   * @注意事项
   * - 事件派发期间新增的同类型事件监听器不会收到当前事件通知
   * - once监听器执行后会立即从监听列表中移除
   * - 如果没有对应类型的监听器，不会执行任何操作
   */
  emit(type: string, ...args: unknown[]): void {
    const handlers = this._events[type.toLowerCase()];
    if (!handlers || handlers.length === 0) return;

    for (let i = 0, n = handlers.length; i < n; i++) {
      const handler = handlers[i];
      if (handler) {
        handler.run(args);
        if (handler.once) {
          handlers.splice(i, 1);
        }
      }
    }
  }

  /**
   * 检查是否有特定类型的事件监听器
   * @param type - 事件类型，不区分大小写
   * @returns 如果存在该类型的事件监听器返回true，否则返回false
   */
  hasListener(type: string): boolean {
    const handlers = this._events[type.toLowerCase()];
    return !!handlers && handlers.length !== 0;
  }

  /**
   * 销毁事件管理器，移除所有监听器并清理资源
   * 销毁后的管理器不应再被使用
   */
  destroy(): void {
    this.offAll();
  }
}
