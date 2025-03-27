import { RegScript } from "../../utils/decorators";
import { Register } from "../../utils/register";
import { Script } from "../script";
import { Ease } from "./ease";

export type PropValue = number | string | Record<string, number | string>;
export type Props = Record<string, PropValue>;

/**
 * 动画类，实现了动画效果脚本
 * 动画生命周期：onEnable > onAwake > onStart > onEnd > onStart > onEnd > onComplete > onDestroy
 */
@RegScript("Effect")
export class Effect extends Script {
  private _from: Record<string, number | Record<string, number>> = {};
  private _diff: Record<string, number | Record<string, number>> = {};
  private _inited = false;
  private _repeatTimes = 0;

  /** 指定动画的初始值，在动画每次开始时进行设置(可选) */
  initial?: Props = undefined;
  /** 此属性决定什么时候初始化 to 和 from 的值，awake 是第一次执行的时候初始化，start 为每次动画执行开始时都会初始化 */
  initType: "awake" | "start" = "awake";
  /** 动画目标状态，设置后则从当前状态缓动到 to 状态 */
  to?: Props = undefined;
  /** 动画开始状态，设置后则从 from 状态缓动到当前状态，同时设置的情况下，to 的优先级高于 from */
  from?: Props = undefined;
  /** 动画持续时长，单位为秒，默认为1秒 */
  duration = 1;
  /** 动画重复间隔，单位为秒，默认为0 */
  repeatDelay = 0;
  /** 是否是yoyo动画 */
  yoyo = false;

  get target(): any {
    return super.target;
  }
  set target(value: any) {
    super.target = value;
  }

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

  private _startTime = 0;
  override get delay(): number {
    return super.delay;
  }
  override set delay(value: number) {
    super.delay = value;
    this._startTime = value;
  }

  private _ease = Ease.Linear;
  /** 缓动曲线函数，默认为匀速缓动 */
  get ease(): (amount: number) => number {
    return this._ease || Ease.Linear;
  }
  set ease(value: ((amount: number) => number) | string) {
    if (typeof value === "string") {
      this._ease = Register.getEase(value);
    } else {
      this._ease = value;
    }
  }

  override start(): void {
    if (!this.started) {
      // 设置初始化属性
      this._initProp();
      super.start();
      if (this.to) this._toKey(this.to);
      else if (this.from) this._fromKey(this.from);
    }
  }

  private _initProp(): void {
    const { initial } = this;
    if (initial) {
      const keys = Object.keys(initial);
      for (const prop of keys) {
        this.target[prop] = this._formatValue(prop, initial[prop]);
      }
    }
  }

  private _formatValue(prop: string, value: PropValue): number | Record<string, number> {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      if (value.startsWith("*")) {
        return this.target[prop] * Number.parseFloat(value.replace("*", ""));
      }
      return (this.target[prop] as number) + Number.parseFloat(value);
    }
    const obj: Record<string, number> = {};
    const keys = Object.keys(value);
    for (const key of keys) {
      const keyValue = value[key];
      if (typeof keyValue === "number") {
        obj[key] = keyValue;
      } else {
        if (keyValue.startsWith("*")) {
          obj[key] = this.target[prop][key] * Number.parseFloat(keyValue.replace("*", ""));
        } else {
          obj[key] = (this.target[prop][key] as number) + Number.parseFloat(keyValue);
        }
      }
    }
    return obj;
  }

  private _toKey(value: Props): void {
    if (!this._inited) {
      const keys = Object.keys(value);
      for (const prop of keys) {
        if (prop in this.target) {
          this._setDiff(prop, this._fromTarget(prop, value[prop]), this._formatValue(prop, value[prop]));
        }
      }
      this._inited = this.initType === "awake";
    }
  }

  private _fromKey(value: Props): void {
    if (!this._inited) {
      const keys = Object.keys(value);
      for (const prop of keys) {
        if (prop in this.target) {
          this._setDiff(prop, this._formatValue(prop, value[prop]), this._fromTarget(prop, value[prop]));
        }
      }
      this._inited = this.initType === "awake";
    }
  }

  private _fromTarget(prop: string, value: PropValue): number | Record<string, number> {
    const val = this.target[prop];
    if (typeof val === "number") return val;

    const obj: Record<string, number> = {};
    const keys = Object.keys(value);
    for (const key of keys) {
      obj[key] = val[key];
    }
    return obj;
  }

  private _setDiff(
    prop: string,
    fromValue: number | Record<string, number>,
    toValue: number | Record<string, number>,
  ): void {
    this._from[prop] = fromValue;
    if (typeof fromValue === "number" && typeof toValue === "number") {
      this._diff[prop] = toValue - fromValue;
    } else if (typeof fromValue === "object" && typeof toValue === "object") {
      const diff: Record<string, number> = {};
      const keys = Object.keys(fromValue);
      for (const key of keys) {
        diff[key] = toValue[key] - fromValue[key];
      }
      this._diff[prop] = diff;
    }
  }

  /**
   * 立即激活动画，即使还没有被执行到
   */
  awakeNow(): void {
    if (!this.awaked) {
      this.awake();
      this.start();
      this.onUpdate(0);
    }
  }

  override update(time: number): void {
    if (this.enabled && !this.ended && time >= this._startTime) {
      this.awaked || this.awake();
      this.started || this.start();
      if (time < this._startTime + this.duration) {
        this.onUpdate(time);
      } else {
        this.end();
      }
    }
  }

  override onUpdate(time: number): void {
    let elapsed = (time - this._startTime) / this.duration;
    elapsed = elapsed < 0 ? 0 : elapsed < 1 ? elapsed : 1;
    this.onValueChanged(this._easeValue(elapsed));
  }

  private _easeValue(elapsed: number) {
    let value = elapsed;
    if (this.yoyo) value = this._repeatTimes % 2 === 0 ? elapsed : 1 - elapsed;
    return this.ease(value);
  }

  /**
   * 动画数据发送变化时
   */
  onValueChanged(value: number) {
    if (!this.target.destroyed) {
      const keys = Object.keys(this._diff);
      for (const prop of keys) {
        const diff = this._diff[prop];
        if (typeof diff === "number") {
          this.target[prop] = (this._from[prop] as number) + diff * value;
        } else {
          // const res: Record<string, number> = {};
          const objProp = this.target[prop];
          const diffKeys = Object.keys(diff);
          for (const key of diffKeys) {
            // res[key] = (this._from[prop] as Record<string, number>)[key] + diff[key] * value;
            objProp[key] = (this._from[prop] as Record<string, number>)[key] + diff[key] * value;
          }
          // this.target[prop] = res;
        }
      }
    }
  }

  /**
   * 结束当前动画循环
   */
  override end(): void {
    this._repeatTimes++;
    if (this._repeatTimes < this.repeat) {
      this._startTime = this.delay + (this.repeatDelay + this.duration) * this._repeatTimes;
      this.started = false;
      this.ended = false;
      this.onValueChanged(this._easeValue(this.yoyo ? 0 : 1));
      this.onEnd();
    } else {
      this.complete();
    }
  }

  /**
   * 结束并停止动画，complete会结束所有动画循环
   */
  complete(): void {
    if (this.ended) return;
    if (this.initType === "awake") {
      this._repeatTimes = this.repeat;
      this.start();
      this.onValueChanged(this._easeValue(this.yoyo ? 0 : 1));
    } else {
      if (this._repeatTimes === this.repeat) {
        this.onValueChanged(this._easeValue(this.yoyo ? 0 : 1));
      } else {
        while (this._repeatTimes <= this.repeat) {
          this.start();
          this.end();
        }
      }
    }

    this.ended = true;
    this.stop();
    this.onEnd();
    this.onComplete(this.target);
  }

  /**
   * 动画播放完毕回调
   */
  onComplete(target: unknown): void {
    //
  }

  override goto(time: number): void {
    if (!this.enabled || this.destroyed) return;

    if (this.repeat > 1) {
      const interval = this.duration + this.repeatDelay;
      this._repeatTimes = time > this.delay + this.duration ? Math.floor((time - this.delay) / interval) : 0;
      if (this._repeatTimes > this.repeat) this._repeatTimes = this.repeat;
      this._startTime = this.delay + interval * this._repeatTimes;
    }

    this.started = false;
    this.ended = false;
    if (time >= this._startTime) {
      this.update(time);
    }
  }

  override reset(time: number): void {
    if (time < this.delay) {
      this.started = false;
      this.ended = false;
      if (this.awaked) this.onUpdate(0);
    }
  }

  /** 自动播放开始时间 */
  private _startPlayTime = 0;
  private _playedTime = 0;
  private _isPlaying = false;
  /**
   * 手动播放动画（相比基于时间轴驱动）
   */
  play(): void {
    if (!this.destroyed && !this._isPlaying) {
      this._isPlaying = true;
      this._startPlayTime = this.stage!.timer.currentTime - this._playedTime;
      this.stage?.timer.frameLoop(1, this._loop, this);
      this._loop();
    }
  }

  private _loop() {
    if (this.target.destroyed) {
      this.destroy();
    } else {
      this.update(this.stage!.timer.currentTime - this._startPlayTime);
    }
  }

  /**
   * 手动停止动画（相比基于时间轴驱动），如果想继续播放，可以直接调用play函数
   */
  stop(): void {
    if (this._isPlaying) {
      this._isPlaying = false;
      this._playedTime = this.stage!.timer.currentTime - this._startPlayTime;
      this.stage?.timer.clear(this._loop, this);
    }
  }

  /**
   * 销毁动画
   */
  override destroy(): void {
    if (!this.destroyed) {
      this.stop();
      super.destroy();
    }
  }
}
