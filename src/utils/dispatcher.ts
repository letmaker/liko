/**
 * 事件处理器类，用于封装回调函数及其执行环境
 */
export class Handler {
  private _destroyed = false;

  /**
   * 创建事件处理器
   * @param callback - 回调函数
   * @param caller - 回调函数执行上下文
   * @param once - 是否只执行一次，执行后自动销毁
   */
  constructor(
    public callback?: (...args: unknown[]) => void,
    public caller?: unknown,
    public once = false,
  ) {}

  /**
   * 销毁事件处理器，销毁后不可再用
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.callback = undefined;
      this.caller = undefined;
    }
  }

  /** 是否已被销毁 */
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
 */
export class Dispatcher {
  private _events: Record<string, Array<Handler>> = {};

  /**
   * 注册事件监听（多次注册，只生效最后一次）
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数
   * @param caller - 回调函数执行上下文
   */
  on(type: string, listener: (...args: any[]) => void, caller?: any): void {
    this._addListener(type, listener, caller, false);
  }

  /**
   * 注册一次性事件监听，事件被执行后自动取消监听（多次注册，只生效最后一次）
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数
   * @param caller - 回调函数执行上下文
   */
  once(type: string, listener: (...args: any[]) => void, caller?: any): void {
    this._addListener(type, listener, caller, true);
  }

  /**
   * 添加事件监听器
   * @param type - 事件类型
   * @param listener - 回调函数
   * @param caller - 回调函数执行上下文
   * @param once - 是否只执行一次
   */
  private _addListener(type: string, listener: (...args: any[]) => void, caller: any, once: boolean): void {
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
   * @param listener - 回调函数，如果为空则删除所有该类型的事件监听
   * @param caller - 回调函数执行上下文
   */
  off(type: string, listener?: (...args: any[]) => void, caller?: any): void {
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
   * 派发事件（事件派发期间，新增的同类型事件监听器不会再收到通知）
   * @param type - 事件类型，不区分大小写
   * @param args - 传递给监听器的参数
   */
  emit(type: string, ...args: any[]): void {
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
   * 检查是否有特定类型的事件监听
   * @param type - 事件类型，不区分大小写
   * @returns 是否存在该类型的事件监听
   */
  hasListener(type: string): boolean {
    const handlers = this._events[type.toLowerCase()];
    return !!handlers && handlers.length !== 0;
  }

  /**
   * 销毁事件管理器，移除所有监听
   */
  destroy() {
    this.offAll();
  }
}
