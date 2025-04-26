import { Timer } from "../../utils/timer";
import { Ease } from "./ease";
import { Effect, type EffectProps, type EffectTarget } from "./effect";

/** 缓动动画配置选项 */
interface TweenOption {
  /** 动画目标对象 */
  target: EffectTarget;
  /** 动画属性集合 */
  props: EffectProps;
  /** 动画持续时长（秒） */
  duration?: number;
  /** 动画标签，可用于停止动画；多次 tween 时会自动停止相同标签的动画 */
  label?: string;
  /** 延迟时间（秒） */
  delay?: number;
  /** 重复次数，默认为 1 次 */
  repeat?: number;
  /** 重复间隔（秒） */
  repeatDelay?: number;
  /** 是否使用往返动画效果 */
  yoyo?: boolean;
  /** 缓动曲线函数 */
  ease?: (amount: number) => number;
  /** 缓动更新回调 */
  onUpdate?: (value: number) => void;
  /** 缓动初始化回调 */
  onAwake?: (target?: EffectTarget) => void;
  /** 缓动开始回调 */
  onStart?: (target?: EffectTarget) => void;
  /** 缓动单循环结束回调 */
  onEnd?: (target?: EffectTarget) => void;
  /** 缓动全部结束回调 */
  onComplete?: (target?: EffectTarget) => void;
}

/**
 * 缓动动画管理类
 *
 * 用于创建和管理对象属性的平滑过渡动画，支持链式调用和队列执行。
 * 动画完成后会自动销毁，释放资源。
 */
export class Tween {
  private static _list: Tween[] = [];

  /**
   * 从目标对象当前状态缓动到指定状态
   *
   * 创建一个新的 Tween 实例。如果设置了 label 标签，会自动清除相同 label 的动画。
   * @param options - 动画参数配置对象
   * @returns 新创建的 Tween 实例
   */
  static to(options: TweenOption): Tween {
    // 清理相同 label 动画
    const label = options.label;
    if (label) Tween.clear(label);

    const tween = new Tween().to(options);
    tween.label = label;
    Tween._list.push(tween);
    return tween;
  }

  /**
   * 从指定状态缓动到目标对象当前状态
   *
   * 创建一个新的 Tween 实例。如果设置了 label 标签，会自动清除相同 label 的动画。
   * @param options - 动画参数配置对象
   * @returns 新创建的 Tween 实例
   */
  static from(options: TweenOption): Tween {
    // 清理相同 label 动画
    const label = options.label;
    if (label) Tween.clear(label);

    const tween = new Tween().from(options);
    tween.label = label;
    Tween._list.push(tween);
    return tween;
  }

  /**
   * 清理指定标签的动画，查找并销毁具有指定标签的第一个动画实例。
   * @param label - 要清理的动画标签
   */
  static clear(label: string) {
    for (const tween of Tween._list) {
      if (tween.label === label) {
        tween.destroy();
        break;
      }
    }
  }

  /**
   * 清理所有动画实例，销毁所有存在的 Tween 实例，并清空缓动列表。
   */
  static clearAll() {
    // 创建副本以避免在迭代过程中修改数组
    const list = [...Tween._list];
    for (const tween of list) {
      tween.destroy();
    }
    Tween._list.length = 0;
  }

  // @testable
  private _effects: Effect[] = [];
  private _current?: Effect;
  private _currentTime = 0;
  private _playing = false;
  private _paused = false;
  private _destroyed = false;

  private _resolve?: (value: void | PromiseLike<void>) => void;
  private _onAllComplete?: () => void;

  /** 是否已销毁 */
  get destroyed(): boolean {
    return this._destroyed;
  }
  /** 是否正在播放中 */
  get playing(): boolean {
    return this._playing;
  }
  /** 是否已暂停 */
  get paused(): boolean {
    return this._paused;
  }

  /** 动画标签，用于标识和管理动画 */
  label?: string;

  /**
   * 立即设置目标对象的属性值
   *
   * 直接修改目标对象的属性，不创建动画过渡效果。
   * @param target - 目标对象
   * @param props - 要设置的属性集合
   * @returns 当前 Tween 实例，支持链式调用
   */
  set(target: EffectTarget, props: Record<string, any>): this {
    const keys = Object.keys(props);
    for (const key of keys) {
      if (key in target) (target as any)[key] = props[key];
    }
    return this;
  }

  /**
   * 从目标对象当前状态缓动到指定状态
   *
   * 创建一个从当前值到目标值的动画效果，并添加到动画队列。
   * @param options - 动画参数配置对象
   * @returns 当前 Tween 实例，支持链式调用
   */
  to(options: TweenOption): this {
    return this._add(true, options);
  }

  /**
   * 从指定状态缓动到目标对象当前状态
   *
   * 创建一个从指定值到当前值的动画效果，并添加到动画队列。
   * @param options - 动画参数配置对象
   * @returns 当前 Tween 实例，支持链式调用
   */
  from(options: TweenOption): this {
    return this._add(false, options);
  }

  /**
   * 添加缓动效果到队列
   * @param isTo - 是否为 to 动画
   * @param options - 动画参数配置对象
   * @returns 当前 Tween 实例
   */
  private _add(isTo: boolean, options: TweenOption): this {
    const effect = new Effect();
    effect.target = options.target;
    effect.duration = options.duration ?? 1;
    effect.ease = options.ease ?? Ease.Linear;
    effect.delay = this._lastEndTime() + (options.delay ?? 0);
    effect.repeat = options.repeat ?? 1;
    effect.repeatDelay = options.repeatDelay ?? 0;
    effect.yoyo = Boolean(options.yoyo);
    if (options.onUpdate) effect.onUpdate = options.onUpdate;
    if (options.onStart) effect.onStart = options.onStart;
    if (options.onEnd) effect.onEnd = options.onEnd;
    if (options.onComplete) effect.onComplete = options.onComplete;

    if (isTo) effect.to = options.props;
    else effect.from = options.props;

    this._effects.push(effect);
    return this;
  }

  private _lastEndTime() {
    if (this._effects.length < 1) return 0;
    const last = this._effects[this._effects.length - 1];
    return last.delay + last.duration;
  }

  /**
   * 处理下一个缓动效果
   */
  private _next() {
    const effect = this._current ?? this._effects.shift();
    if (effect) {
      this._current = effect;
      const complete = effect.onComplete;
      effect.onComplete = () => {
        this._current = undefined;
        if (complete) complete.call(effect, effect.target);
        this._next();
      };
    } else {
      this.stop();
      if (this._resolve) this._resolve();
      if (this._onAllComplete) this._onAllComplete();
      this.destroy();
    }
  }

  /**
   * 开始播放缓动队列
   *
   * 按顺序执行队列中的所有动画效果。如果已经在播放或已销毁，则直接返回已解析的 Promise。
   * @returns 返回一个 Promise，当所有动画完成时解析
   */
  play(): Promise<void> {
    if (this._destroyed || this._playing) return Promise.resolve();

    return new Promise((resolve) => {
      this._currentTime = 0;
      this._paused = false;
      this._resolve = resolve;
      this._playing = true;
      this._next();
      this._update();
      Timer.system.onFrame(this._update, this);
    });
  }

  /**
   * 更新当前缓动效果
   */
  private _update(delta?: number) {
    this._currentTime += delta ?? Timer.system.delta;
    this._current?.update(this._currentTime);
  }

  /**
   * 暂停缓动队列，暂停当前正在播放的动画，可通过 resume 方法恢复播放。
   * @returns 当前 Tween 实例，支持链式调用
   */
  pause(): this {
    if (this._playing && !this._paused) {
      this._paused = true;
      Timer.system.clearTimer(this._update, this);
    }
    return this;
  }

  /**
   * 恢复已暂停的缓动队列，恢复之前暂停的动画继续播放。
   * @returns 当前 Tween 实例，支持链式调用
   */
  resume(): this {
    if (this._playing && this._paused) {
      this._paused = false;
      Timer.system.onFrame(this._update, this);
    }
    return this;
  }

  /**
   * 停止缓动队列，停止当前动画播放，可通过 play 方法重新开始播放。
   * @returns 当前 Tween 实例，支持链式调用
   */
  stop(): this {
    if (this._playing) {
      this._playing = false;
      this._paused = false; // 重置暂停状态
      Timer.system.clearTimer(this._update, this);
    }
    return this;
  }

  /**
   * 销毁整个缓动队列，清理所有资源并从全局管理列表中移除，销毁后不可再用。
   */
  destroy(): void {
    if (this._destroyed) return;

    this._destroyed = true;
    this.stop();

    this._effects.length = 0;
    this._current = undefined;
    this._resolve = undefined;
    this._onAllComplete = undefined;

    // 清理队列
    const index = Tween._list.indexOf(this);
    if (index !== -1) {
      Tween._list.splice(index, 1);
    }
  }

  /**
   * 设置整个缓动队列结束时的回调，当所有动画效果执行完毕后调用指定的回调函数。
   * @param callback - 结束回调函数
   * @returns 当前 Tween 实例，支持链式调用
   */
  onAllComplete(callback: () => void): this {
    this._onAllComplete = callback;
    return this;
  }
}
