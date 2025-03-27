import type { Node } from "../../nodes/node";
import { Ease } from "./ease";
import { Effect } from "./effect";

/** 缓动可选参数 */
interface TweenOption {
  /** 动画目标对象 */
  target: unknown;
  /** 动画属性 */
  props: Record<string, any>;
  /** 动画持续时长，单位为秒 */
  duration: number;
  /** 延迟时间，单位为秒 */
  delay?: number;
  /** 重复次数，默认为1次 */
  repeat?: number;
  /** 重复间隔，单位为秒 */
  repeatDelay?: number;
  /** 是否是yoyo动画 */
  yoyo?: boolean;
  /** 缓动曲线函数 */
  ease?: (amount: number) => number;
  /** 缓动更新回调 */
  onUpdate?: (value: number) => void;
  /** 缓动开始回调 */
  onStart?: () => void;
  /** 缓动单循环结束回调 */
  onEnd?: () => void;
  /** 缓动全部结束回调 */
  onComplete?: (target: any) => void;
}

interface TweenOptionWidthLabel extends TweenOption {
  /** 动画标签，可以基于此标签，停止动画；在播放时，默认也会自动停止相同标签的动画 */
  label?: string;
}

/**
 * 缓动类，实现缓动队列
 */
export class Tween {
  private static _tweens: Tween[] = [];
  /**
   * 从 target 当前状态缓动到 props 状态，可以连续 to，然后调用 play 播放，播放完毕后会自动销毁动画
   * @param options 动画参数，如果设置 label 标签，则会自动清除相同的 label 的动画
   */
  static to(options: TweenOptionWidthLabel): Tween {
    // 清理相同 label 动画
    const label = options.label;
    if (label) Tween.clear(label);

    const tween = new Tween().to(options);
    tween.label = label;
    Tween._tweens.push(tween);
    return tween;
  }

  /**
   * 从 props 缓动到 target 当前状态，可以连续 from，然后调用 play 播放，播放完毕后会自动销毁动画
   * @param options 动画参数
   */
  static from(options: TweenOptionWidthLabel): Tween {
    // 清理相同 label 动画
    const label = options.label;
    if (label) Tween.clear(label);

    const tween = new Tween().from(options);
    tween.label = label;
    Tween._tweens.push(tween);
    return tween;
  }

  /**
   * 清理某个 label 的动画
   */
  static clear(label: string) {
    for (const tween of Tween._tweens) {
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

  label? = "";

  /**
   * 设置属性，立即生效
   * @param target 目标缓动对象
   * @param props 缓动目标属性列表
   */
  set(target: Node, props: Record<string, unknown>): this {
    target.setProps(props);
    return this;
  }

  /**
   * 从target当前状态缓动到props状态
   * @param options 动画参数
   */
  to(options: TweenOption): this {
    return this._add(true, options);
  }

  /**
   * 从props缓动到target当前状态
   * @param options 动画参数
   */
  from(options: TweenOption): this {
    return this._add(false, options);
  }

  private _add(isTo: boolean, options: TweenOption): this {
    const param = {
      delay: 0,
      repeat: 1,
      repeatDelay: 0,
      ease: Ease.Linear,
      ...options,
    };

    const effect = new Effect();
    effect.target = options.target;
    effect.duration = param.duration;
    effect.ease = param.ease;
    effect.delay = param.delay;
    effect.repeatDelay = param.repeatDelay;
    effect.repeat = param.repeat;
    effect.yoyo = Boolean(param.yoyo);
    if (param.onUpdate) effect.onValueChanged = param.onUpdate;
    if (param.onStart) effect.onStart = param.onStart;
    if (param.onEnd) effect.onEnd = param.onEnd;
    if (param.onComplete) effect.onComplete = param.onComplete;

    if (isTo) effect.to = param.props;
    else effect.from = param.props;

    this._effects.push(effect);
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
      }
    });
  }

  private _next() {
    const effect = this._current ?? this._effects.shift();
    if (effect) {
      this._current = effect;
      effect.play();
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
   * 停止缓动队列，如果想继续播放，可以直接调用play函数
   */
  stop(): Tween {
    if (this._playing) {
      this._playing = false;
      this._current?.stop();
    }
    return this;
  }

  /**
   * 整个缓动队列结束时回调
   */
  onAllComplete(callBack: () => void): Tween {
    this._onAllComplete = callBack;
    return this;
  }

  /**
   * 销毁整个缓动队列，销毁后，则不可再用
   */
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      this.stop();

      // 销毁所有动画
      for (const tween of this._effects) {
        tween.destroy();
      }
      this._effects.length = 0;
      this._current = undefined;

      // 清理队列
      for (let i = 0; i < Tween._tweens.length; i++) {
        const tween = Tween._tweens[i];
        if (tween === this) {
          Tween._tweens.splice(i, 1);
          break;
        }
      }
      if (this._onDestroy) this._onDestroy();
    }
  }

  /**
   * 整个缓动队列被销毁时回调
   */
  onDestroy(callBack: () => void): Tween {
    this._onDestroy = callBack;
    return this;
  }
}
