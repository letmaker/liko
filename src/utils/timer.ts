import { Handler } from './dispatcher';

class TimerHandler extends Handler {
  nextTime = 0;

  constructor(
    callback: (...args: unknown[]) => void,
    caller: unknown,
    once = false,
    public args?: unknown[],
    public delay = 0,
    public useFrame = false
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
 *
 * 主要用于渲染相关的计时回调，不适用于精确的时间判断
 * 支持基于时间和基于帧数的两种计时模式
 *
 * @example
 * ```typescript
 * // 默认情况下，使用 stage.timer 全局计时器
 * const timer = stage.timer;
 *
 * // 延迟执行一次（3秒后执行）
 * timer.setTimeout(3, () => console.log('3秒后执行'), this);
 *
 * // 循环执行（每2秒执行一次）
 * timer.setInterval(2, () => console.log('每2秒执行'), this);
 *
 * // 每帧执行
 * timer.onFrame(() => console.log('每帧执行'), this);
 *
 * // 使用系统计时器
 * Timer.system.setTimeout(1, () => console.log('系统计时器'), this);
 *
 * // 延迟到下一帧执行（去重复）
 * Timer.callLater(() => console.log('下一帧执行'), this);
 *
 * // 清理计时器
 * timer.clearTimer(callback, this); // 清理指定回调
 * timer.clearAll(this); // 清理指定caller的所有回调
 * timer.destroy(); // 销毁整个计时器
 * ```
 *
 * @注意事项
 * - 循环计时器的最小间隔：基于时间的为0.001秒，基于帧的为1帧
 * - 重复注册相同的callback和caller会先清理之前的注册
 * - 使用Timer.system需要手动清理，建议优先使用stage的timer实例
 * - Timer.callLater每帧多次调用相同callback和caller只会执行一次
 * - 计时器暂停或销毁后不会执行回调
 */
export class Timer {
  /**
   * 系统级 Timer 实例，全局共享
   *
   * @注意 使用此实例需要手动清理，业务代码应优先使用 stage 的 timer 实例
   */
  static readonly system: Timer = new Timer();

  private static readonly _callLaterList: TimerHandler[] = [];

  /**
   * 在渲染之前延迟执行，用于减少重复计算
   *
   * 每帧多次调用相同的callback和caller只会执行一次，适用于需要去重的延迟执行场景
   *
   * @param callback 回调函数
   * @param caller 调用者，用于标识回调的归属和去重
   * @param args 回调参数
   * @returns 是否添加成功，重复添加相同callback和caller只有第一次成功
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

  /**
   * 执行所有延迟回调
   *
   * 通常在每帧渲染前调用，执行所有通过callLater注册的回调
   */
  static runAllCallLater(): void {
    if (Timer._callLaterList.length > 0) {
      for (let i = 0; i < Timer._callLaterList.length; i++) {
        Timer._callLaterList[i].run();
      }
      Timer._callLaterList.length = 0;
    }
  }

  private _timers: TimerHandler[] = [];
  private _lastTime = 0;

  /**
   * 每帧时间间隔，单位为秒
   *
   * 在update方法中自动计算，表示当前帧与上一帧的时间差
   */
  delta = 0;

  /**
   * 时间缩放系数
   *
   * 影响计时器的时间流逝速度，1为正常速度，0.5为半速，2为双速
   * 只影响基于时间的计时器，不影响基于帧的计时器
   */
  scale = 1;

  /**
   * 当前累计时间，单位为秒
   *
   * 受时间缩放系数影响的累计时间，用于基于时间的计时判断
   */
  currentTime = 0;

  /**
   * 当前累计帧数
   *
   * 自计时器创建以来的总帧数，用于基于帧的计时判断
   */
  currentFrame = 0;

  private _paused = false;

  /**
   * 计时器是否暂停
   *
   * 暂停状态下delta为0，所有计时回调不会执行
   */
  get paused(): boolean {
    return this._paused;
  }

  /**
   * 当前计时器中的有效监听数量
   *
   * 不包括已销毁的计时器处理器
   */
  get count(): number {
    let count = 0;
    for (const timer of this._timers) {
      !timer.destroyed && count++;
    }
    return count;
  }

  private _destroyed = false;

  /**
   * 计时器是否已销毁
   *
   * 销毁后无法添加新的计时回调，update方法也不会执行
   */
  get destroyed(): boolean {
    return this._destroyed;
  }

  /**
   * 销毁计时器
   *
   * 清理所有计时回调并标记为已销毁，销毁后无法恢复
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.clearAll();
    }
  }

  /**
   * 延迟执行计时回调一次
   *
   * @param delay 延迟时间，单位为秒，必须大于0
   * @param callback 回调函数
   * @param caller 调用者，用于标识回调归属和清理，重复注册会先清理之前的注册
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
   * 循环延迟执行计时回调
   *
   * @param interval 时间间隔，单位为秒，最小值为0.001秒
   * @param callback 回调函数
   * @param caller 调用者，用于标识回调归属和清理，重复注册会先清理之前的注册
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
   * 每帧执行回调
   *
   * @param callback 回调函数
   * @param caller 调用者，用于标识回调归属和清理，重复注册会先清理之前的注册
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
    once?: boolean
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
   *
   * @param callback 回调函数
   * @param caller 调用者，如果不指定则清理所有匹配callback的回调
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
   * 清理计时回调
   *
   * @param caller 指定函数域，如果不指定，则清除本计时器所有回调
   */
  clearAll(caller?: any): void {
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
   *
   * 暂停后delta为0，所有计时回调停止执行，但计时器状态保持
   */
  pause(): void {
    this._paused = true;
  }

  /**
   * 恢复计时器
   *
   * 恢复计时器的正常运行，继续执行计时回调
   */
  resume(): void {
    this._paused = false;
  }

  /**
   * 更新计时器
   *
   * 通常在游戏主循环中调用，用于驱动所有计时回调的执行
   *
   * @param currTime 当前时间，单位为秒，默认使用系统计时器的当前时间
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

      // 定期清理已销毁的 timer
      if (this.currentFrame % 2000 === 0) {
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
