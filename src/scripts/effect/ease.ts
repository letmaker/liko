// 效果速查: https://www.xuanfengge.com/easeing/easeing/#

const PI_2 = Math.PI / 2;
const BOUNCE_FACTOR = 7.5625;
const BACK_FACTOR = 1.70158;
const BACK_FACTOR_INOUT = BACK_FACTOR * 1.525;
const JELLY_FACTOR = 6.9813172;

type EaseFunction = (amount: number) => number;

export const Ease: Record<string, EaseFunction> = {
  /**
   * 直线无缓动
   */
  Linear(amount: number): number {
    return amount;
  },
  /**
   * 二次方缓动
   */
  QuadIn(amount: number): number {
    return amount * amount;
  },
  /**
   * 二次方缓动
   */
  QuadOut(amount: number): number {
    return amount * (2 - amount);
  },
  /**
   * 二次方缓动
   */
  QuadInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v * v;
    return -0.5 * (--v * (v - 2) - 1);
  },
  /**
   * 三次方缓动
   */
  CubicIn(amount: number): number {
    return amount * amount * amount;
  },
  /**
   * 三次方缓动
   */
  CubicOut(amount: number): number {
    const v = amount - 1;
    return v ** 3 + 1;
  },
  /**
   * 三次方缓动
   */
  CubicInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v ** 3;
    v = v - 2;
    return 0.5 * (v ** 3 + 2);
  },
  /**
   * 四次方缓动
   */
  QuartIn(amount: number): number {
    return amount ** 4;
  },
  /**
   * 四次方缓动
   */
  QuartOut(amount: number): number {
    const v = amount - 1;
    return 1 - v ** 4;
  },
  /**
   * 四次方缓动
   */
  QuartInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v ** 4;
    v = v - 2;
    return -0.5 * (v ** 4 - 2);
  },
  /**
   * 五次方缓动
   */
  QuintIn(amount: number): number {
    return amount * amount * amount * amount * amount;
  },
  /**
   * 五次方缓动
   */
  QuintOut(amount: number): number {
    const v = amount - 1;
    return v ** 5 + 1;
  },
  /**
   * 五次方缓动
   */
  QuintInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v ** 5;
    v = v - 2;
    return 0.5 * (v ** 5 + 2);
  },
  /**
   * 正弦缓动
   */
  SineIn(amount: number): number {
    return 1 - Math.sin((1.0 - amount) * PI_2);
  },
  /**
   * 正弦缓动
   */
  SineOut(amount: number): number {
    return Math.sin(amount * PI_2);
  },
  /**
   * 正弦缓动
   */
  SineInOut(amount: number): number {
    return 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)));
  },
  /**
   * 指数缓动
   */
  ExpoIn(amount: number): number {
    return amount === 0 ? 0 : 1024 ** (amount - 1);
  },
  /**
   * 指数缓动
   */
  ExpoOut(amount: number): number {
    return amount === 1 ? 1 : 1 - 2 ** (-10 * amount);
  },
  /**
   * 指数缓动
   */
  ExpoInOut(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    const v = amount * 2;
    if (v < 1) return 0.5 * 1024 ** (v - 1);
    return 0.5 * (-(2 ** (-10 * (v - 1))) + 2);
  },
  /**
   * 圆周缓动
   */
  CircIn(amount: number): number {
    return 1 - Math.sqrt(1 - amount * amount);
  },
  /**
   * 圆周缓动
   */
  CircOut(amount: number): number {
    const v = amount - 1;
    return Math.sqrt(1 - v * v);
  },
  /**
   * 圆周缓动
   */
  CircInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return -0.5 * (Math.sqrt(1 - v * v) - 1);
    v = v - 2;
    return 0.5 * (Math.sqrt(1 - v * v) + 1);
  },
  /**
   * 弹性缓动
   */
  ElasticIn(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    return -(2 ** (10 * (amount - 1))) * Math.sin((amount - 1.1) * 5 * Math.PI);
  },
  /**
   * 弹性缓动
   */
  ElasticOut(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    return 2 ** (-10 * amount) * Math.sin((amount - 0.1) * 5 * Math.PI) + 1;
  },
  /**
   * 弹性缓动
   */
  ElasticInOut(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    const v = amount * 2;
    if (v < 1) return -0.5 * 2 ** (10 * (v - 1)) * Math.sin((v - 1.1) * 5 * Math.PI);
    return 0.5 * 2 ** (-10 * (v - 1)) * Math.sin((v - 0.1) * 5 * Math.PI) + 1;
  },
  /**
   * 返回缓动
   */
  BackIn(amount: number): number {
    return amount === 1 ? 1 : amount * amount * ((BACK_FACTOR + 1) * amount - BACK_FACTOR);
  },
  /**
   * 返回缓动
   */
  BackOut(amount: number): number {
    const v = amount - 1;
    return amount === 0 ? 0 : v * v * ((BACK_FACTOR + 1) * v + BACK_FACTOR) + 1;
  },
  /**
   * 返回缓动
   */
  BackInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * (v * v * ((BACK_FACTOR_INOUT + 1) * v - BACK_FACTOR_INOUT));
    v = v - 2;
    return 0.5 * (v * v * ((BACK_FACTOR_INOUT + 1) * v + BACK_FACTOR_INOUT) + 2);
  },
  /**
   * 反弹缓动
   */
  BounceIn(amount: number): number {
    return 1 - Ease.BounceOut(1 - amount);
  },
  /**
   * 反弹缓动
   */
  BounceOut(amount: number): number {
    if (amount < 1 / 2.75) {
      return BOUNCE_FACTOR * amount * amount;
    }
    if (amount < 2 / 2.75) {
      const v = amount - 1.5 / 2.75;
      return BOUNCE_FACTOR * v * v + 0.75;
    }
    if (amount < 2.5 / 2.75) {
      const v = amount - 2.25 / 2.75;
      return BOUNCE_FACTOR * v * v + 0.9375;
    }
    const v = amount - 2.625 / 2.75;
    return BOUNCE_FACTOR * v * v + 0.984375;
  },
  /**
   * 反弹缓动
   */
  BounceInOut(amount: number): number {
    if (amount < 0.5) return Ease.BounceIn(amount * 2) * 0.5;
    return Ease.BounceOut(amount * 2 - 1) * 0.5 + 0.5;
  },

  /**
   * 立即显示
   */
  Immediately(amount: number): number {
    return amount > 0 ? 1 : 0;
  },
  /**
   * 脉搏跳动 0>1>0 sine动画
   */
  Pulse(amount: number): number {
    if (amount < 0.5) return Ease.SineIn(amount * 2);
    return 1 - Ease.SineOut((amount - 0.5) * 2);
  },
  /**
   * 果冻效果
   */
  Jelly(amount: number): number {
    if (amount < 0.5) return Math.sin(JELLY_FACTOR * Ease.SineIn(amount * 2));
    return Math.sin(JELLY_FACTOR * (1 - Ease.SineOut((amount - 0.5) * 2)));
  },
  /**
   * 冲撞反弹 0>1>0 QuarticOut>BounceOut
   */
  Collision(amount: number): number {
    if (amount < 0.25) return Ease.QuartOut(amount * 4);
    return 1 - Ease.BounceOut(((amount - 0.25) * 4) / 3);
  },
  /**
   * 钟摆效果 0>1>0>1>0 匀速
   */
  Pendulum(amount: number): number {
    if (amount < 0.25) return amount * 4;
    if (amount < 0.5) return 1 - (amount - 0.25) * 4;
    if (amount < 0.75) return (amount - 0.5) * 4;
    return 1 - (amount - 0.75) * 4;
  },
  /**
   * 心跳效果 0>1>0>1>0 Quadratic动画
   */
  Heart(amount: number): number {
    if (amount < 0.25) return Ease.QuadOut(amount * 4);
    if (amount < 0.5) return 1 - Ease.QuadIn((amount - 0.25) * 4);
    if (amount < 0.75) return Ease.QuadOut((amount - 0.5) * 4);
    return 1 - Ease.QuadIn((amount - 0.75) * 4);
  },
  /**
   * 呼吸效果 0>1>0>-1>0 Quadratic动画
   */
  Breathe(amount: number): number {
    if (amount < 0.25) return Ease.QuartOut(amount * 4);
    if (amount < 0.5) return 1 - Ease.QuadIn((amount - 0.25) * 4);
    if (amount < 0.75) return -Ease.QuartOut((amount - 0.5) * 4);
    return Ease.QuadIn((amount - 0.75) * 4) - 1;
  },
  /**
   * 波浪 0>1 0>1 0>1 0>1 匀速
   */
  Wave(amount: number): number {
    if (amount < 0.25) return amount * 4;
    if (amount < 0.5) return (amount - 0.25) * 4;
    if (amount < 0.75) return (amount - 0.5) * 4;
    return (amount - 0.75) * 4;
  },
  /**
   * 秋千递减震动 0>1>0>-1>0 0>0.5>0>-0.5>0 Quadratic动画
   */
  Swing(amount: number): number {
    if (amount < 0.5) return Ease.Breathe(amount * 2);
    return Ease.Breathe((amount - 0.5) * 2) * 0.5;
  },
  /**
   * 故障闪烁 0>1>0 5次直线动画 然后慢放一次直线动画
   */
  Flash(amount: number): number {
    if (amount < 0.1) return Ease.Linear(amount * 10);
    if (amount < 0.2) return 1 - Ease.Linear((amount - 0.1) * 10);
    if (amount < 0.3) return Ease.Linear((amount - 0.2) * 10);
    if (amount < 0.4) return 1 - Ease.Linear((amount - 0.3) * 10);
    if (amount < 0.5) return Ease.Linear((amount - 0.4) * 10);
    return Ease.Linear((amount - 0.5) * 2);
  },
  /**
   * 抖动效果
   */
  Shake(amount: number): number {
    const decay = 1 - amount;
    return Math.sin(amount * 30) * decay * decay;
  },
};

/**
 * 根据名称获取缓动函数
 * @param name 缓动函数名称，必须是 Ease 对象中的一个键
 * @returns 对应的缓动函数，如果未找到则返回 Linear 函数
 */
export function getEase(name: string): EaseFunction {
  return Ease[name] || Ease.Linear;
}
