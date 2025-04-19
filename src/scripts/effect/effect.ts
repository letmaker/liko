import { Ease, getEase } from "./ease";

/** 属性值类型，可以是数字、字符串或包含数字/字符串的对象 */
type PropValue = number | string | Record<string, number | string>;
/** 效果目标对象类型 */
export type EffectTarget = Record<string, any>;
/** 效果属性类型 */
export type EffectProps = Record<string, PropValue>;

/**
 * 效果缓动类，用于实现属性动画
 *
 * 支持对目标对象的属性进行平滑过渡动画，可以设置动画的起始值、目标值、
 * 持续时间、缓动函数等参数，并提供动画控制功能。
 */
export class Effect {
  private _from: Record<string, number | Record<string, number>> = {};
  private _diff: Record<string, number | Record<string, number>> = {};
  private _repeatTimes = 0;

  /** 缓动目标对象 */
  target: EffectTarget = {};
  /** 动画目标状态，设置后则从当前状态缓动到 to 状态 */
  to?: EffectProps = undefined;
  /** 动画开始状态，设置后则从 from 状态缓动到当前状态，同时设置的情况下，to 的优先级高于 from */
  from?: EffectProps = undefined;

  private _startTime = 0;
  private _delay = 0;
  /** 动画延迟开始时间，单位为秒 */
  get delay(): number {
    return this._delay;
  }
  set delay(value: number) {
    this._delay = value;
    this._startTime = value;
  }

  /** 动画持续时长，单位为秒 */
  duration = 1;

  private _repeat = 1;
  /** 动画重复次数，默认为1次，设置为0时表示无限重复 */
  get repeat(): number {
    return this._repeat;
  }
  set repeat(value: number) {
    if (value !== this._repeat) {
      this._repeat = value <= 0 ? Number.POSITIVE_INFINITY : value;
    }
  }

  /** 动画重复间隔，单位为秒 */
  repeatDelay = 0;
  /** 是否为yoyo动画，为true时动画会来回播放 */
  yoyo = false;

  private _ease = Ease.Linear;
  /** 缓动曲线函数 */
  get ease(): (amount: number) => number {
    return this._ease;
  }
  set ease(value: ((amount: number) => number) | string) {
    if (typeof value === "string") {
      this._ease = getEase(value);
    } else {
      this._ease = value;
    }
  }

  /** 是否第一次被激活 */
  awaked = false;
  /** 是否已经开始播放 */
  started = false;
  /** 是否已经结束播放 */
  ended = false;

  /**
   * 通过数据设置属性
   * @param props - 属性列表
   */
  setProps(props?: Record<string, unknown>) {
    if (props) {
      const keys = Object.keys(props);
      for (const key of keys) {
        this.setProp(key, props[key]);
      }
    }
  }

  /**
   * 设置单个属性
   * @param key - 属性名
   * @param value - 属性值
   */
  setProp(key: string, value: any) {
    if (key in this) (this as Record<string, unknown>)[key] = value;
  }

  /**
   * 更新动画状态
   * @param currTime - 当前时间
   */
  update(currTime: number): void {
    if (!this.ended && currTime >= this._startTime) {
      this.started || this._start();
      if (currTime < this._startTime + this.duration) {
        this._updateProgress(currTime);
      } else {
        this._end();
      }
    }
  }

  /**
   * 开始动画
   * 初始化动画参数并触发相关回调
   */
  private _start(): void {
    if (!this.awaked) {
      this.awaked = true;
      if (this.to) this._toKey(this.to);
      else if (this.from) this._fromKey(this.from);
      this.onAwake(this.target);
    }
    if (!this.started) {
      this.started = true;
      this.onStart(this.target);
    }
  }

  /**
   * 处理目标状态属性
   * @param value - 目标状态属性集合
   */
  private _toKey(value: EffectProps): void {
    const keys = Object.keys(value);
    for (const prop of keys) {
      if (prop in this.target) {
        this._setDiff(prop, this._fromTarget(prop, value[prop]), this._formatValue(prop, value[prop]));
      }
    }
  }

  /**
   * 处理起始状态属性
   * @param value - 起始状态属性集合
   */
  private _fromKey(value: EffectProps): void {
    const keys = Object.keys(value);
    for (const prop of keys) {
      if (prop in this.target) {
        this._setDiff(prop, this._formatValue(prop, value[prop]), this._fromTarget(prop, value[prop]));
      }
    }
  }

  /**
   * 从目标对象获取属性值
   * @param prop - 属性名
   * @param value - 属性值定义
   * @returns 格式化后的属性值
   */
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

  /**
   * 格式化属性值，支持相对值和绝对值
   * @param prop - 属性名
   * @param value - 原始属性值
   * @returns 格式化后的属性值
   */
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

  /**
   * 设置属性的起始值和差值
   * @param prop - 属性名
   * @param fromValue - 起始值
   * @param toValue - 目标值
   */
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
   * 更新动画进度
   * @param currTime - 当前时间
   */
  private _updateProgress(currTime: number): void {
    let elapsed = (currTime - this._startTime) / this.duration;
    elapsed = elapsed < 0 ? 0 : elapsed < 1 ? elapsed : 1;
    this.onUpdate(this._easeValue(elapsed));
  }

  /**
   * 应用缓动函数计算实际进度值
   * @param elapsed - 原始进度值(0-1)
   * @returns 应用缓动后的进度值
   */
  private _easeValue(elapsed: number) {
    let value = elapsed;
    if (this.yoyo) value = this._repeatTimes % 2 === 0 ? elapsed : 1 - elapsed;
    return this.ease(value);
  }

  /**
   * 根据进度更新目标对象的属性
   * @param progress - 当前动画进度(0-1)
   */
  onUpdate(progress: number) {
    const keys = Object.keys(this._diff);
    for (const prop of keys) {
      const diff = this._diff[prop];
      if (typeof diff === "number") {
        this.target[prop] = (this._from[prop] as number) + diff * progress;
      } else {
        const objProp = this.target[prop];
        const diffKeys = Object.keys(diff);
        for (const key of diffKeys) {
          objProp[key] = (this._from[prop] as Record<string, number>)[key] + diff[key] * progress;
        }
      }
    }
  }

  /**
   * 处理动画结束
   * 如果需要重复播放，则重置状态并继续，否则完成动画
   */
  private _end(): void {
    this._repeatTimes++;
    if (this._repeatTimes < this.repeat) {
      this._startTime = this.delay + (this.repeatDelay + this.duration) * this._repeatTimes;
      this.started = false;
      this.ended = false;
      this.onUpdate(this._easeValue(this.yoyo ? 0 : 1));
      this.onEnd(this.target);
    } else {
      this._complete();
    }
  }

  /**
   * 完成动画
   * 设置最终状态并触发完成回调
   */
  private _complete(): void {
    this.onUpdate(this._easeValue(this.yoyo ? 0 : 1));
    this.ended = true;
    this.onEnd(this.target);
    this.onComplete(this.target);
  }

  /**
   * 跳转到指定时间点的动画状态
   * @param time - 目标时间点
   */
  goto(time: number): void {
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

  reset() {
    this._repeatTimes = 0;
    this._startTime = this.delay;
    this.started = false;
    this.ended = false;
    this.awaked = false;
  }

  /**
   * 动画被激活时触发，仅在第一次被激活时触发
   * @param target - 动画目标对象
   */
  // @ts-expect-error
  onAwake(target: EffectTarget): void {}

  /**
   * 每次动画开始执行时触发（repeat>1时，会重复执行）
   * @param target - 动画目标对象
   */
  // @ts-expect-error
  onStart(target: EffectTarget): void {}

  /**
   * 每次动画结束执行时触发（repeat>1时，会重复执行）
   * @param target - 动画目标对象
   */
  // @ts-expect-error
  onEnd(target: EffectTarget): void {}

  /**
   * 动画播放完毕回调
   * @param target - 动画目标对象
   */
  // @ts-expect-error
  onComplete(target: EffectTarget): void {}
}
