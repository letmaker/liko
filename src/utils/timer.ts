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
 * 计时器类，基于帧驱动的计时系统
 * 主要用于渲染相关的计时回调，不适用于精确的时间判断
 */
export class Timer {
  /** 系统级Timer实例，业务代码应优先使用stage的timer，使用此实例需手动移除 */
  static readonly system: Timer = new Timer();

  /** 延迟执行的处理器列表 */
  private static readonly _callLaterList: Array<TimerHandler> = [];

  /**
   * 在渲染之前，延迟执行，用于减少重复计算，每帧多次调用只执行一次
   * @param callback 回调函数
   * @param caller 调用者
   * @param args 回调参数
   * @returns 是否添加成功（重复添加只有第一次成功）
   */
  static callLater<T extends (...args: any[]) => void>(callback: T, caller?: unknown, ...args: Parameters<T>): boolean {
    for (const handler of Timer._callLaterList) {
      if (handler.callback === callback && handler.caller === caller) {
        return false;
      }
    }
    const handler = new TimerHandler(callback, caller, true, args);
    Timer._callLaterList.push(handler);
    return true;
  }

  static runAllCallLater() {
    if (Timer._callLaterList.length > 0) {
      for (let i = 0; i < Timer._callLaterList.length; i++) {
        Timer._callLaterList[i].run();
      }
      Timer._callLaterList.length = 0;
    }
  }

  private _timers: TimerHandler[] = [];
  private _lastTime = 0;

  /** 每帧时间间隔，单位为秒 */
  delta = 0;
  /** 时间缩放系数 */
  scale = 1;
  /** 当前累计时间，单位为秒 */
  currentTime = 0;
  /** 当前累计帧数 */
  currentFrame = 0;

  private _paused = false;
  /** 计时器是否暂停 */
  get paused(): boolean {
    return this._paused;
  }

  /** 当前计时器中的有效监听数量 */
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

  /**
   * 销毁计时器
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.clearAll();
    }
  }

  /**
   * 延迟执行计时回调一次，重复注册会先清理之前的注册
   * @param delay 延迟时间，单位为秒
   * @param callback 回调函数
   * @param caller 调用者
   * @param args 回调参数
   */
  setTimeout<T extends (...args: any[]) => void>(
    delay: number,
    callback: T,
    caller?: unknown,
    ...args: Parameters<T>
  ): void {
    this._add(delay, callback, caller, args, false, true);
  }

  /**
   * 循环延迟执行计时回调，重复注册会先清理之前的注册
   * @param interval 时间间隔，单位为秒
   * @param callback 回调函数
   * @param caller 调用者
   * @param args 回调参数
   */
  setInterval<T extends (...args: any[]) => void>(
    interval: number,
    callback: T,
    caller?: unknown,
    ...args: Parameters<T>
  ): void {
    this._add(interval, callback, caller, args, false, false);
  }

  /**
   * 每帧执行回调，重复注册会先清理之前的注册
   * @param callback 回调函数
   * @param caller 调用者
   * @param args 回调参数
   */
  onFrame<T extends (...args: any[]) => void>(callback: T, caller?: unknown, ...args: Parameters<T>): void {
    this._add(1, callback, caller, args, true, false);
  }

  /**
   * 添加计时器处理器
   * @param delay 延迟时间/帧数
   * @param callback 回调函数
   * @param caller 调用者
   * @param args 回调参数
   * @param useFrame 是否使用帧模式
   * @param once 是否只执行一次
   */
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
    this.clearTimer(callback, caller);
    const timer = new TimerHandler(callback, caller, once, args, delayNum, useFrame);
    timer.nextTime = (useFrame ? this.currentFrame : this.currentTime) + delayNum;
    this._timers.push(timer);
  }

  /**
   * 清理指定计时回调
   * @param callback 回调函数
   * @param caller 调用者
   */
  clearTimer(callback: (...args: any[]) => void, caller?: unknown): void {
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

  /**
   * 暂停计时器
   */
  pause(): void {
    this._paused = true;
  }

  /**
   * 恢复计时器
   */
  resume(): void {
    this._paused = false;
  }

  /**
   * 更新计时器
   * @param currTime 当前时间，单位为秒
   */
  update(currTime: number = Timer.system.currentTime): void {
    if (this._paused || this._destroyed) {
      this.delta = 0;
      return;
    }

    if (currTime > this._lastTime) {
      const delta = currTime - this._lastTime;
      this._lastTime = currTime;
      this.delta = delta * this.scale;
      this.currentTime += this.delta;
      this.currentFrame++;

      const timers = this._timers;
      for (const timer of timers) {
        const timeOrFrame = timer.useFrame ? this.currentFrame : this.currentTime;
        if (timeOrFrame >= timer.nextTime) {
          timer.runTime(timeOrFrame);
        }
      }

      // 定期清理已销毁的timer
      if (this.currentFrame % 5000 === 0) {
        this._clean();
      }
    } else {
      this.delta = 0;
    }
  }

  /**
   * 清理已销毁的计时器处理器
   */
  private _clean(): void {
    if (this._timers.length > 0) {
      this._timers = this._timers.filter((timer) => !timer.destroyed);
    }
  }
}
