import { Ease, getEase } from './ease';

type PropNumber = number | `+${number}` | `-${number}` | `*${number}`;
/**
 * 表示可以作为动画属性的值类型
 * @remarks
 * 可以是以下类型之一：
 * - 数字：用于直接的数值过渡
 * - 字符串：用于相对值，如 "+10" 或 "*2"
 * - 对象：包含数字或字符串的复合属性
 */
type PropValue = PropNumber | Record<string, PropNumber>;

/** 表示可以应用动画效果的目标对象类型 */
export type EffectTarget = Record<string, any>;

/** 表示动画效果的属性集合类型 */
export type EffectProps = Record<string, PropValue>;

/**
 * 属性动画效果类
 */
export class Effect {
  /** 存储动画属性的初始值 */
  private _from: Record<string, number | Record<string, number>> = {};
  /** 存储动画属性的变化量 */
  private _diff: Record<string, number | Record<string, number>> = {};
  /** 当前重复播放的次数 */
  private _repeatTimes = 0;

  /**
   * 动画的目标对象
   */
  target: EffectTarget = {};

  /**
   * 动画的目标状态
   * @remarks
   * 设置后，动画将从目标对象的当前状态过渡到此状态
   * 支持绝对值和相对值（如 "+10" 或 "*2"）
   */
  to?: EffectProps = undefined;

  /**
   * 动画的起始状态
   * @remarks
   * 设置后，动画将从此状态过渡到目标对象的当前状态
   * 当同时设置 to 和 from 时，to 的优先级更高
   */
  from?: EffectProps = undefined;

  private _startTime = 0;
  private _delay = 0;

  /**
   * 动画延迟开始的时间（秒）
   * @remarks
   * 设置此值会同时更新动画的实际开始时间
   */
  get delay(): number {
    return this._delay;
  }
  set delay(value: number) {
    this._delay = value;
    this._startTime = value;
  }

  /**
   * 动画的持续时间（秒）
   * @default 1
   */
  duration = 1;

  /** 动画的重复次数 */
  private _repeat = 1;

  /**
   * 动画的重复播放次数
   * @remarks
   * 默认为 1 次，设置为 0 或负数时表示无限重复
   */
  get repeat(): number {
    return this._repeat;
  }
  set repeat(value: number) {
    if (value !== this._repeat) {
      this._repeat = value <= 0 ? Number.POSITIVE_INFINITY : value;
    }
  }

  /**
   * 动画重复播放的间隔时间（秒）
   * @default 0
   */
  repeatDelay = 0;

  /**
   * 是否启用往返动画效果
   * @remarks
   * 当设置为 true 时，动画会在正向播放完成后反向播放
   * @default false
   */
  yoyo = false;

  private _ease = Ease.Linear;

  /**
   * 动画的缓动函数
   * @remarks
   * 可以通过函数或预定义的缓动名称设置
   * @default Ease.Linear
   */
  get ease(): (amount: number) => number {
    return this._ease;
  }
  set ease(value: ((amount: number) => number) | string) {
    if (typeof value === 'string') {
      this._ease = getEase(value);
    } else {
      this._ease = value;
    }
  }

  /**
   * 动画是否已被初始化
   * @remarks
   * 仅在首次调用 update 时被设置为 true
   */
  awaked = false;

  /**
   * 动画是否已开始播放
   * @remarks
   * 在每次重复播放开始时被设置为 true
   */
  started = false;

  /**
   * 动画是否已结束播放
   * @remarks
   * 在所有重复播放完成后被设置为 true
   */
  ended = false;

  /**
   * 批量设置动画属性
   * @param props - 要设置的属性键值对
   * @remarks
   * 可以一次性设置多个动画属性，如 duration、delay、ease 等
   * 只有在 Effect 类中定义的属性才会被设置
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
   * 设置单个动画属性
   * @param key - 属性名称
   * @param value - 属性值
   * @remarks
   * 只有在 Effect 类中定义的属性才会被设置
   */
  setProp(key: string, value: any) {
    if (key in this) (this as Record<string, unknown>)[key] = value;
  }

  /**
   * 更新动画状态
   * @param currTime - 当前时间（秒）
   * @remarks
   * 此方法需要在每一帧被调用以更新动画状态
   * 会根据当前时间计算动画进度并更新目标对象的属性
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
   * 初始化并开始动画
   * @private
   * @remarks
   * 负责初始化动画参数，计算属性变化量，并触发相关回调
   * 确保动画只被初始化一次，但可以多次开始播放
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
   * 处理目标状态的属性设置
   * @private
   * @param value - 目标状态的属性集合
   * @remarks
   * 计算从当前状态到目标状态的属性变化量
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
   * 处理起始状态的属性设置
   * @private
   * @param value - 起始状态的属性集合
   * @remarks
   * 计算从起始状态到当前状态的属性变化量
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
   * 从目标对象获取属性的当前值
   * @private
   * @param prop - 属性名称
   * @param value - 属性值定义，用于确定需要获取的子属性
   * @returns 格式化后的属性值
   * @remarks
   * 支持获取简单数值属性和复合对象属性
   */
  private _fromTarget(prop: string, value: PropValue): number | Record<string, number> {
    const val = this.target[prop];
    if (typeof val === 'number') return val;

    const obj: Record<string, number> = {};
    const keys = Object.keys(value);
    for (const key of keys) {
      obj[key] = val[key];
    }
    return obj;
  }

  /**
   * 格式化属性值，处理相对值和绝对值
   * @private
   * @param prop - 属性名称
   * @param value - 原始属性值
   * @returns 格式化后的属性值
   * @remarks
   * 支持以下格式：
   * - 数字：直接作为绝对值
   * - 字符串："+n" 表示增加，"*n" 表示倍数
   * - 对象：包含多个子属性的复合值
   */
  private _formatValue(prop: string, value: PropValue): number | Record<string, number> {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      if (value.startsWith('*')) {
        return this.target[prop] * Number.parseFloat(value.replace('*', ''));
      }
      return (this.target[prop] as number) + Number.parseFloat(value);
    }
    const obj: Record<string, number> = {};
    const keys = Object.keys(value);
    for (const key of keys) {
      const keyValue = value[key];
      if (typeof keyValue === 'number') {
        obj[key] = keyValue;
      } else {
        if (keyValue.startsWith('*')) {
          obj[key] = this.target[prop][key] * Number.parseFloat(keyValue.replace('*', ''));
        } else {
          obj[key] = (this.target[prop][key] as number) + Number.parseFloat(keyValue);
        }
      }
    }
    return obj;
  }

  /**
   * 设置属性的起始值和变化量
   * @private
   * @param prop - 属性名称
   * @param fromValue - 起始值
   * @param toValue - 目标值
   * @remarks
   * 计算并存储属性的初始值和总变化量
   * 支持简单数值和复合对象的差值计算
   */
  private _setDiff(
    prop: string,
    fromValue: number | Record<string, number>,
    toValue: number | Record<string, number>
  ): void {
    this._from[prop] = fromValue;
    if (typeof fromValue === 'number' && typeof toValue === 'number') {
      this._diff[prop] = toValue - fromValue;
    } else if (typeof fromValue === 'object' && typeof toValue === 'object') {
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
   * @private
   * @param currTime - 当前时间（秒）
   * @remarks
   * 根据当前时间计算动画进度，并应用缓动函数
   * 确保进度值在 0-1 范围内
   */
  private _updateProgress(currTime: number): void {
    let elapsed = (currTime - this._startTime) / this.duration;
    elapsed = elapsed < 0 ? 0 : elapsed < 1 ? elapsed : 1;
    this.onUpdate(this._easeValue(elapsed));
  }

  /**
   * 计算实际的动画进度值
   * @private
   * @param elapsed - 原始进度值（0-1）
   * @returns 应用缓动和 yoyo 效果后的进度值
   * @remarks
   * 处理 yoyo 效果并应用缓动函数
   * yoyo 模式下，奇数次重复会反向播放
   */
  private _easeValue(elapsed: number) {
    let value = elapsed;
    if (this.yoyo) value = this._repeatTimes % 2 === 0 ? elapsed : 1 - elapsed;
    return this.ease(value);
  }

  /**
   * 根据进度更新目标对象的属性
   * @param progress - 当前动画进度（0-1）
   * @remarks
   * 根据初始值和变化量计算当前属性值
   * 支持更新简单数值和复合对象的属性
   */
  onUpdate(progress: number) {
    const keys = Object.keys(this._diff);
    for (const prop of keys) {
      const diff = this._diff[prop];
      if (typeof diff === 'number') {
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
   * 处理动画的结束状态
   * @private
   * @remarks
   * 处理动画的重复播放逻辑：
   * - 如果未达到重复次数，重置状态并继续播放
   * - 如果达到重复次数，调用完成处理
   * 每次重复播放都会触发 onEnd 回调
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
   * 完成整个动画
   * @private
   * @remarks
   * 设置最终状态并触发回调：
   * 1. 更新到最终状态
   * 2. 标记动画结束
   * 3. 触发 onEnd 和 onComplete 回调
   */
  private _complete(): void {
    this.onUpdate(this._easeValue(this.yoyo ? 0 : 1));
    this.ended = true;
    this.onEnd(this.target);
    this.onComplete(this.target);
  }

  /**
   * 跳转到指定时间点的动画状态
   * @param time - 目标时间点（秒）
   * @remarks
   * 支持在动画时间轴上自由跳转：
   * - 自动计算重复播放次数
   * - 重置动画状态
   * - 更新到指定时间的状态
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

  /**
   * 重置动画到初始状态
   * @remarks
   * 重置所有状态标志和计数器：
   * - 重复次数归零
   * - 开始时间重置为延迟值
   * - 清除所有状态标志
   */
  reset() {
    this._repeatTimes = 0;
    this._startTime = this.delay;
    this.started = false;
    this.ended = false;
    this.awaked = false;
  }

  /**
   * 动画初始化回调
   * @param target - 动画目标对象
   * @remarks
   * 仅在动画第一次被激活时触发一次
   * 可以用于初始化目标对象的状态
   */
  // @ts-expect-error
  onAwake(target: EffectTarget): void {}

  /**
   * 动画开始播放回调
   * @param target - 动画目标对象
   * @remarks
   * 在每次播放开始时触发
   * 重复播放时会多次触发
   */
  // @ts-expect-error
  onStart(target: EffectTarget): void {}

  /**
   * 动画播放结束回调
   * @param target - 动画目标对象
   * @remarks
   * 在每次播放结束时触发
   * 重复播放时会多次触发
   */
  // @ts-expect-error
  onEnd(target: EffectTarget): void {}

  /**
   * 动画完全结束回调
   * @param target - 动画目标对象
   * @remarks
   * 仅在所有重复播放都完成后触发一次
   * 可以用于清理或执行后续操作
   */
  // @ts-expect-error
  onComplete(target: EffectTarget): void {}
}
