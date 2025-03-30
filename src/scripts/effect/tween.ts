import { Timer } from "../../utils/timer";
import { Ease } from "./ease";
import { Effect, type EffectProps, type EffectTarget } from "./effect";

/** 缓动动画配置选项 */
interface TweenOption {
  /** 动画目标对象 */
  target: EffectTarget;
  /** 动画属性集合 */
  props: EffectProps;
  /** 动画持续时长(秒) */
  duration: number;
  /** 动画标签，可用于停止动画；多次tween时会自动停止相同标签的动画 */
  label?: string;
  /** 延迟时间(秒) */
  delay?: number;
  /** 重复次数，默认为1次 */
  repeat?: number;
  /** 重复间隔(秒) */
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
 * 用于创建和管理对象属性的平滑过渡动画
 */
export class Tween {
  private static _list: Tween[] = [];

  /**
   * 从目标对象当前状态缓动到指定状态
   *
   * @param options - 动画参数，设置label标签时会自动清除相同label的动画
   * @returns 新创建的Tween实例
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
   * @param options - 动画参数，设置label标签时会自动清除相同label的动画
   * @returns 新创建的Tween实例
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
   * 清理指定标签的动画
   *
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

  private _effects: Array<Effect> = [];
  private _current?: Effect;
  private _playing = false;
  private _destroyed = false;
  private _resolve?: (value: void | PromiseLike<void>) => void;
  private _onAllComplete?: () => void;
  private _onDestroy?: () => void;

  /** 动画标签，用于标识和管理动画 */
  label?: string;

  /**
   * 立即设置目标对象的属性值
   *
   * @param target - 目标对象
   * @param props - 要设置的属性集合
   * @returns 当前Tween实例
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
   * @param options - 动画参数
   * @returns 当前Tween实例
   */
  to(options: TweenOption): this {
    return this._add(true, options);
  }

  /**
   * 从指定状态缓动到目标对象当前状态
   *
   * @param options - 动画参数
   * @returns 当前Tween实例
   */
  from(options: TweenOption): this {
    return this._add(false, options);
  }

  /**
   * 添加缓动效果到队列
   *
   * @param isTo - 是否为to动画
   * @param options - 动画参数
   * @returns 当前Tween实例
   */
  private _add(isTo: boolean, options: TweenOption): this {
    const effect = new Effect();
    effect.target = options.target;
    effect.duration = options.duration;
    effect.ease = options.ease ?? Ease.Linear;
    effect.delay = options.delay ?? 0;
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
    if (!this._current) {
      this._next();
    }
    return this;
  }

  /**
   * 开始播放缓动队列
   */
  play(): Promise<void> {
    return new Promise((resolve) => {
      if (!this._destroyed && !this._playing) {
        this._resolve = resolve;
        this._playing = true;
        this._next();
        Timer.system.loop(1, this._update, this);
      }
    });
  }

  /**
   * 更新当前缓动效果
   */
  private _update() {
    if (this._playing) {
      this._current?.update(Timer.system.delta);
    }
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
   * 停止缓动队列，可通过play继续播放
   *
   * @returns 当前Tween实例
   */
  stop(): Tween {
    if (this._playing) {
      this._playing = false;
      Timer.system.clear(this._update, this);
    }
    return this;
  }

  /**
   * 销毁整个缓动队列，销毁后不可再用
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.stop();

      this._effects.length = 0;
      this._current = undefined;

      // 清理队列
      for (let i = 0; i < Tween._list.length; i++) {
        const tween = Tween._list[i];
        if (tween === this) {
          Tween._list.splice(i, 1);
          break;
        }
      }
      if (this._onDestroy) this._onDestroy();
    }
  }

  /**
   * 设置整个缓动队列结束时的回调
   *
   * @param callBack - 结束回调函数
   * @returns 当前Tween实例
   */
  onAllComplete(callBack: () => void): Tween {
    this._onAllComplete = callBack;
    return this;
  }

  /**
   * 设置缓动队列被销毁时的回调
   *
   * @param callBack - 销毁回调函数
   * @returns 当前Tween实例
   */
  onDestroy(callBack: () => void): Tween {
    this._onDestroy = callBack;
    return this;
  }
}
