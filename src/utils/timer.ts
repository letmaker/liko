import { Handler } from "./dispatcher";

class TimerHandler extends Handler {
  nextTime = 0;

  constructor(
    callback: (...args: unknown[]) => void,
    caller: unknown,
    once = false,
    public args?: unknown[],
    public delay = 0,
    public useFrame = false,
  ) {
    super(callback, caller, once);
  }

  runTime(time: number): void {
    super.run(this.args);
    if (!this.once) {
      this.nextTime = time + this.delay - ((time - this.nextTime) % this.delay);
    }
  }

  override run(): void {
    super.run(this.args);
    if (!this.once) this.nextTime += this.delay;
  }

  override destroy(): void {
    if (!this.destroyed) {
      this.nextTime = Number.POSITIVE_INFINITY;
      super.destroy();
    }
  }
}

/**
 * 计时器，本计时器用帧驱动，不是很精确，主要用来做一些渲染相关的计时回调，不建议用来做精确的时间判断
 */
export class Timer {
  /** 这里是系统 Timer，业务尽量使用 stage 的 timer，如果非要使用此 timer，不用时需要手动移除 */
  static readonly system: Timer = new Timer();
  /** callLater 列表 */
  static readonly callLaterList: Array<TimerHandler> = [];

  /**
   * 延迟一帧执行，多用来减少重复的计算，每帧多次调用，只执行一次
   * @param callback 回调函数
   * @param caller 回调函数域
   * @param args 参数（可选）
   * @returns 返回是否添加成功（多次添加，只有第一次成功）
   */
  static callLater<T extends (...args: any[]) => void>(callback: T, caller?: unknown, ...args: Parameters<T>): boolean {
    for (const handler of Timer.callLaterList) {
      if (handler.callback === callback && handler.caller === caller) {
        return false;
      }
    }
    const handler = new TimerHandler(callback, caller, true, args);
    Timer.callLaterList.push(handler);
    return true;
  }

  private _timers: TimerHandler[] = [];
  private _lastTime = 0;

  /** 每帧间隔，单位为妙 */
  delta = 0;
  /** 时间缩放系数 */
  scale = 1;
  /** 当前时间，单位为妙 */
  currentTime = 0;
  /** 当前帧数 */
  currentFrame = 0;

  /** 当前计时器内的所有监听数量 */
  get count(): number {
    let count = 0;
    for (const timer of this._timers) {
      !timer.destroyed && count++;
    }
    return count;
  }

  private _destroyed = false;
  /** 计时器是否销毁 */
  get destroyed() {
    return this._destroyed;
  }

  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.clearAll();
    }
  }

  /**
   * 延迟执行计时回调一次，重复注册，只生效一次
   * @param delay 延迟时间，单位为秒
   * @param callback 回调函数
   * @param caller 回调函数作用域
   * @param args 参数（可选）
   */
  once<T extends (...args: any[]) => void>(delay: number, callback: T, caller?: unknown, ...args: Parameters<T>): void {
    this._add(delay, callback, caller, args, false, true);
  }

  /**
   * 循环延迟执行计时回调，重复注册，只生效一次
   * @param delay 延迟时间，单位为秒
   * @param callback 回调函数
   * @param caller 回调函数作用域
   * @param args 参数（可选）
   */
  loop<T extends (...args: any[]) => void>(
    interval: number,
    callback: T,
    caller?: unknown,
    ...args: Parameters<T>
  ): void {
    this._add(interval, callback, caller, args, false, false);
  }

  /**
   * 延迟指定帧执行计时回调一次，重复注册，只生效一次
   * @param delay 延迟帧数
   * @param callback 回调函数
   * @param caller 回调函数作用域
   * @param args 参数（可选）
   */
  frameOnce<T extends (...args: any[]) => void>(
    delay: number,
    callback: T,
    caller?: unknown,
    ...args: Parameters<T>
  ): void {
    this._add(delay, callback, caller, args, true, true);
  }

  /**
   * 循环延迟指定帧执行计时回调，重复注册，只生效一次
   * @param delay 延迟帧数
   * @param callback 回调函数
   * @param caller 回调函数作用域
   * @param args 参数（可选）
   */
  frameLoop<T extends (...args: any[]) => void>(
    interval: number,
    callback: T,
    caller?: unknown,
    ...args: Parameters<T>
  ): void {
    this._add(interval, callback, caller, args, true, false);
  }

  private _add<T extends (...args: unknown[]) => void>(
    delay: number,
    callback: T,
    caller: unknown,
    args?: unknown[],
    useFrame?: boolean,
    once?: boolean,
  ) {
    if (this._destroyed) return;
    let delayNum = delay;
    if (!once) {
      // 循环间隔不能太小
      if (useFrame && delay < 1) delayNum = 1;
      if (!useFrame && delay < 0.001) delayNum = 0.001;
    }

    // 禁止重复注册
    this.clear(callback, caller);
    const timer = new TimerHandler(callback, caller, once, args, delayNum, useFrame);
    timer.nextTime = (useFrame ? this.currentFrame : this.currentTime) + delayNum;
    this._timers.push(timer);
  }

  /**
   * 清理某个计时回调
   * @param callback 回调函数
   * @param caller 回调函数域
   */
  clear(callback: (...args: any[]) => void, caller?: unknown): void {
    for (const timer of this._timers) {
      if (timer.callback === callback && (!caller || timer.caller === caller)) {
        timer.destroy();
        return;
      }
    }
  }

  /**
   * 清理所有计时回调
   * @param caller 指定函数域，如果不指定，则清除本计时器所有回调
   */
  clearAll(caller?: unknown): void {
    const timers = this._timers;
    for (const timer of timers) {
      if (!caller || timer.caller === caller) {
        timer.destroy();
      }
    }
    if (!caller) timers.length = 0;
  }

  update(currTime: number = Timer.system.currentTime): void {
    if (currTime > this._lastTime) {
      const delta = currTime - this._lastTime;
      this._lastTime = currTime;
      this.delta = delta * this.scale;
      this.currentTime += this.delta;
      this.currentFrame += this.scale;

      const timers = this._timers;
      for (const timer of timers) {
        const timeOrFrame = timer.useFrame ? this.currentFrame : this.currentTime;
        if (timeOrFrame >= timer.nextTime) {
          timer.runTime(timeOrFrame);
        }
      }

      // 定期clean掉销毁的 timer
      if (this.currentFrame % 5000 === 0) {
        this._clean();
      }
    } else {
      this.delta = 0;
    }
  }

  private _clean(): void {
    if (this._timers.length > 0) {
      this._timers = this._timers.filter((timer) => !timer.destroyed);
    }
  }
}
