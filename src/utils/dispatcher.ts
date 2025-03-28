/**
 * 事件处理器
 */
export class Handler {
  private _destroyed = false;

  /**
   * 销毁事件处理器，销毁后则不可再用
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.callback = undefined;
      this.caller = undefined;
    }
  }

  /**
   * 创建事件处理器
   * @param callback 回调函数
   * @param caller 回调函数所在的域，一般为this
   * @param once 是否只执行一次，执行后处理器会被自动销毁，默认为false
   */
  constructor(
    public callback?: (...args: unknown[]) => void,
    public caller?: unknown,
    public once = false,
  ) {}

  /** 是否已经被销毁 */
  get destroyed() {
    return this._destroyed;
  }

  /**
   * 执行回调函数
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
 * 事件管理器
 */
export class Dispatcher {
  private _events: Record<string, Array<Handler>> = {};

  /**
   * 注册事件监听（多次注册，只生效最后一次）
   * @param type 事件类型，不区分大小写
   * @param listener 回调函数
   * @param caller 回调函数所在的域，一般为this
   */
  on(type: string, listener: (...args: any[]) => void, caller?: any): void {
    this._addListener(type, listener, caller, false);
  }

  /**
   * 注册一次性事件监听，事件被执行后，则自动取消监听（多次注册，只生效最后一次）
   * @param type 事件类型，不区分大小写
   * @param listener 回调函数
   * @param caller 回调函数所在的域，一般为this
   */
  once(type: string, listener: (...args: any[]) => void, caller?: any): void {
    this._addListener(type, listener, caller, true);
  }

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
   * @param type 事件类型，不区分大小写
   * @param listener 回调函数，如果为空，则删除所有 type 类型的事件监听
   * @param caller 回调函数所在的域，一般为this
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
   * 取消特定域的所有事件监听，如果参数为空，则清空所有事件监听
   * @param caller 函数域，可选，如果为空，则清空所有事件监听
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
   * 派发事件
   * @param type 事件名称，不区分大小写
   * @param args 可选参数，支持多个，以逗号隔开
   */
  emit(type: string, ...args: any[]): void {
    const handlers = this._events[type.toLowerCase()];
    if (!handlers || handlers.length === 0) return;

    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      handler.run(args);
      if (handler.once) {
        handlers.splice(i, 1);
        i--;
      }
    }
  }

  /**
   * 是否有监听
   * @param type 事件名称，不区分大小写
   */
  hasListener(type: string): boolean {
    const handlers = this._events[type.toLowerCase()];
    return handlers && handlers.length !== 0;
  }

  /**
   * 销毁，移除所有监听
   */
  destroy() {
    this.offAll();
  }
}
