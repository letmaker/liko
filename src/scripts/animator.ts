import { Effect } from "./effect/effect";
import { ScriptBase } from "./script-base";

interface IEffect {
  /** 目标对象的ID */
  targetID: string;
  /** 延迟开始时间(秒) */
  delay: number;
  /** 效果持续时间(秒) */
  duration: number;
  /** 缓动函数名称 */
  easing?: string;
  /** 重复次数 */
  repeat?: number;
  /** 重复之间的延迟时间(秒) */
  repeatDelay?: number;
  /** 是否往返动画 */
  yoyo?: boolean;
  /** 初始状态属性 */
  initial?: Record<string, any>;
  /** 起始状态属性 */
  from?: Record<string, any>;
  /** 目标状态属性 */
  to?: Record<string, any>;
}

/**
 * 动画控制器类，用于管理和播放多个动画效果
 */
export class Animator extends ScriptBase {
  /** 动画总持续时间，一般由编辑器设定，以秒为单位 */
  duration = 0;
  /** 时间缩放因子，控制动画播放速度 */
  timeScale = 1;
  /** 当前播放时间，以秒为单位 */
  currentTime = 0;

  private _paused = false;
  /** 动画是否暂停 */
  get paused(): boolean {
    return this._paused;
  }

  private _repeatTimes = 0;
  private _repeat = 1;
  /** 动画重复次数，默认为1次，设置为0，等同于无数次 */
  get repeat(): number {
    return this._repeat;
  }
  set repeat(value: number) {
    if (value !== this._repeat) {
      this._repeat = value < 1 ? Number.POSITIVE_INFINITY : value;
    }
  }

  private _effectList: Effect[] = [];
  private _effects: IEffect[] = [];
  /** 获取或设置动画效果数据，数据一般由编辑器产生 */
  get effects(): IEffect[] {
    return this._effects;
  }
  set effects(value: IEffect[]) {
    this._effects = value;

    this._effectList.length = 0;
    for (const item of value) {
      const target = this.target.getChild({ id: item.targetID, deep: true });
      if (target) {
        const effect = new Effect();
        effect.target = target;
        effect.setProps(item as Record<string, any>);
        this._effectList.push(effect);

        effect.onStart = () => {
          this.signal("animator.startEffect", effect);
        };
        effect.onEnd = () => {
          this.signal("animator.endEffect", effect);
        };
      }
    }
  }

  /**
   * 暂停动画播放
   */
  pause(): void {
    this._paused = true;
  }

  /**
   * 恢复动画播放
   */
  resume(): void {
    this._paused = false;
  }

  /**
   * 跳转到指定时间点
   * @param time - 目标时间点
   */
  goto(time: number): void {
    this.currentTime = time;
    for (const effect of this._effectList) {
      effect.goto(time);
    }
  }

  /**
   * 组件唤醒时调用
   */
  onAwake(): void {
    this.signal("animator.awake");
  }

  /**
   * 每帧更新动画状态
   * @param delta - 帧间隔时间
   */
  onUpdate(delta: number): void {
    if (this._paused || this.currentTime > this.duration || this.duration === 0) return;

    this.currentTime += delta * this.timeScale;

    for (const effect of this._effectList) {
      effect.update(this.currentTime);
    }

    if (this.currentTime >= this.duration) {
      this.signal("animator.end");
      this._repeatTimes++;
      if (this._repeatTimes < this.repeat) {
        this.currentTime = this.currentTime % this.duration;
      } else {
        this.signal("animator.complete");
      }
    }
  }

  /**
   * 销毁组件
   */
  override destroy(): void {
    super.destroy();
    this._effects.length = 0;
    this._effectList.length = 0;
  }
}
