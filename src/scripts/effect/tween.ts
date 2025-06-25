import { Timer } from '../../utils/timer';
import { Ease } from './ease';
import { Effect, type EffectProps, type EffectTarget } from './effect';

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
 * 提供强大的对象属性动画功能，支持链式调用、队列执行、标签管理等特性。
 * 动画完成后会自动销毁以释放资源。
 *
 * @example
 * ```typescript
 * // 基础使用 - 移动对象
 * Tween.to({
 *   target: gameObject,
 *   props: { x: 100, y: 200 },
 *   duration: 1,
 *   ease: Ease.OutQuad
 * }).play();
 *
 * // 链式调用 - 创建动画序列
 * new Tween()
 *   .to({ target: sprite, props: { x: 100 }, duration: 1 })
 *   .wait(0.5)
 *   .to({ target: sprite, props: { alpha: 0 }, duration: 0.5 })
 *   .call(() => sprite.visible = false)
 *   .onAllComplete(() => console.log('动画结束'))
 *   .play();
 *
 * // 使用标签管理动画
 * Tween.to({
 *   target: player,
 *   props: { x: 200 },
 *   duration: 2,
 *   label: "player-move"
 * });
 * // 停止指定标签的动画
 * Tween.clear("player-move");
 *
 * // 复杂动画配置
 * const tween = Tween.to({
 *   target: enemy,
 *   props: { x: 300, y: 150, rotation: 360 },
 *   duration: 2,
 *   delay: 1,
 *   repeat: 3,
 *   yoyo: true,
 *   ease: Ease.InOutBounce,
 *   onStart: () => console.log("动画开始"),
 *   onComplete: () => console.log("动画结束")
 * });
 * tween.play();
 * ```
 *
 * @注意事项
 * - 动画完成后会自动销毁，无需手动清理
 * - 相同 label 的动画会被自动替换
 * - 使用 wait() 和 call() 可以创建复杂的动画序列
 * - 暂停状态下的动画可以通过 resume() 恢复
 */
export class Tween {
  private static _list: Tween[] = [];

  /**
   * 创建从当前状态到目标状态的动画
   *
   * 这是最常用的动画方法，从对象当前属性值平滑过渡到指定的目标值。
   * 如果指定了 label，会自动停止具有相同 label 的现有动画。
   *
   * @param options - 动画配置选项
   * @returns 新创建的 Tween 实例，可用于链式调用
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
   * 创建从指定状态到当前状态的动画
   *
   * 先将对象属性设置为指定值，然后动画过渡回原来的状态。
   * 常用于对象淡入效果（从透明到可见）或位置复位动画。
   * 如果指定了 label，会自动停止具有相同 label 的现有动画。
   *
   * @param options - 动画配置选项
   * @returns 新创建的 Tween 实例，可用于链式调用
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
   * 停止指定标签的动画
   *
   * 查找并销毁具有指定标签的第一个动画实例。
   * 用于精确控制特定动画的生命周期。
   *
   * @param label - 要停止的动画标签
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
   * 停止所有动画
   *
   * 销毁所有存在的 Tween 实例并清空全局动画列表。
   * 常用于场景切换或游戏重置时的资源清理。
   */
  static clearAll() {
    // 创建副本以避免在迭代过程中修改数组
    const list = [...Tween._list];
    for (const tween of list) {
      tween.destroy();
    }
    Tween._list.length = 0;
  }

  private _effects: Effect[] = [];
  private _current?: Effect;
  private _currentTime = 0;
  private _isPlaying = false;
  private _paused = false;
  private _destroyed = false;

  private _resolve?: (value: void | PromiseLike<void>) => void;
  private _onAllComplete?: () => void;

  /**
   * 动画是否已被销毁
   *
   * 销毁后的动画实例不能再次使用，需要创建新实例。
   */
  get destroyed(): boolean {
    return this._destroyed;
  }

  /**
   * 动画是否正在播放中
   *
   * 包括正在执行和暂停状态的动画。
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * 动画是否已暂停
   *
   * 暂停状态下动画不会更新，但保持播放状态。
   */
  get paused(): boolean {
    return this._paused;
  }

  /**
   * 动画标签
   *
   * 用于标识和管理动画，相同标签的动画会被自动替换。
   * 可以通过 Tween.clear(label) 停止指定标签的动画。
   */
  label?: string;

  /**
   * 立即设置对象属性值
   *
   * 直接修改目标对象的属性，不产生动画过渡效果。
   * 常用于在动画序列中立即更改对象状态。
   *
   * @param target - 目标对象
   * @param props - 要设置的属性键值对
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
   * 添加从当前状态到目标状态的动画到队列
   *
   * 在动画队列末尾添加一个新的 to 动画。
   * 支持链式调用以创建复杂的动画序列。
   *
   * @param options - 动画配置选项
   * @returns 当前 Tween 实例，支持链式调用
   */
  to(options: TweenOption): this {
    return this._add(true, options);
  }

  /**
   * 添加从指定状态到当前状态的动画到队列
   *
   * 在动画队列末尾添加一个新的 from 动画。
   * 支持链式调用以创建复杂的动画序列。
   *
   * @param options - 动画配置选项
   * @returns 当前 Tween 实例，支持链式调用
   */
  from(options: TweenOption): this {
    return this._add(false, options);
  }

  /**
   * 添加等待时间到动画队列
   *
   * 在动画序列中插入指定时长的等待时间。
   * 常用于在连续动画之间创建停顿效果。
   *
   * @param seconds - 等待时长（秒）
   * @returns 当前 Tween 实例，支持链式调用
   */
  wait(seconds: number): this {
    return this._add(true, {
      target: {} as any,
      props: {},
      duration: seconds,
    });
  }

  /**
   * 添加回调函数到动画队列
   *
   * 在动画序列中的特定时机执行回调函数。
   * 常用于在动画过程中触发游戏逻辑或状态改变。
   *
   * @param callback - 要执行的回调函数
   * @returns 当前 Tween 实例，支持链式调用
   */
  call(callback: () => void): this {
    return this._add(true, {
      target: {} as any,
      props: {},
      duration: 0,
      onStart: callback,
    });
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
   * 开始播放动画队列
   *
   * 按顺序执行队列中的所有动画效果。
   * 如果动画已在播放或已被销毁，会直接返回已解析的 Promise。
   * 动画完成后会自动销毁实例。
   *
   * @returns Promise，当所有动画完成时解析
   */
  play(): Promise<void> {
    if (this._destroyed || this._isPlaying) return Promise.resolve();

    return new Promise((resolve) => {
      this._currentTime = 0;
      this._paused = false;
      this._resolve = resolve;
      this._isPlaying = true;
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
   * 暂停动画播放
   *
   * 暂停当前正在播放的动画，保持所有状态。
   * 可以通过 resume() 方法恢复播放。
   * 对未播放或已销毁的动画无效果。
   *
   * @returns 当前 Tween 实例，支持链式调用
   */
  pause(): this {
    if (this._isPlaying && !this._paused) {
      this._paused = true;
      Timer.system.clearTimer(this._update, this);
    }
    return this;
  }

  /**
   * 恢复动画播放
   *
   * 恢复之前暂停的动画继续播放。
   * 对未暂停或已销毁的动画无效果。
   *
   * @returns 当前 Tween 实例，支持链式调用
   */
  resume(): this {
    if (this._isPlaying && this._paused) {
      this._paused = false;
      Timer.system.onFrame(this._update, this);
    }
    return this;
  }

  /**
   * 停止动画播放
   *
   * 停止当前动画播放，但不销毁实例。
   * 可以通过 play() 方法重新开始播放整个动画队列。
   * 停止时会重置暂停状态。
   *
   * @returns 当前 Tween 实例，支持链式调用
   */
  stop(): this {
    if (this._isPlaying) {
      this._isPlaying = false;
      this._paused = false; // 重置暂停状态
      Timer.system.clearTimer(this._update, this);
    }
    return this;
  }

  /**
   * 销毁动画实例
   *
   * 清理所有资源并从全局管理列表中移除。
   * 销毁后的实例不能再次使用，需要创建新实例。
   * 会自动停止正在播放的动画。
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
   * 设置所有动画完成时的回调
   *
   * 当动画队列中的所有动画效果都执行完毕后调用指定的回调函数。
   * 在 play() 返回的 Promise 解析之前触发。
   *
   * @param callback - 完成回调函数
   * @returns 当前 Tween 实例，支持链式调用
   */
  onAllComplete(callback: () => void): this {
    this._onAllComplete = callback;
    return this;
  }
}
