/**
 * 缓动函数集合 - 提供各种动画缓动效果
 *
 * 该模块包含常用的缓动函数，用于创建平滑的动画过渡效果。
 * 所有缓动函数接受 0-1 范围的输入值，输出通常也在 0-1 范围内。
 *
 * 效果速查: https://www.xuanfengge.com/easeing/easeing/#
 */

const PI_2 = Math.PI / 2;
const BOUNCE_FACTOR = 7.5625;
const BACK_FACTOR = 1.70158;
const BACK_FACTOR_INOUT = BACK_FACTOR * 1.525;
const JELLY_FACTOR = 6.9813172;

/**
 * 缓动函数类型定义
 * @param amount - 动画进度值，范围 0-1
 * @returns 缓动后的值，通常范围 0-1（某些特殊效果可能超出此范围）
 */
type EaseFunction = (amount: number) => number;

/**
 * 缓动函数集合对象
 * 包含各种类型的缓动效果，适用于不同的动画场景
 */
export const Ease = {
  /**
   * 直线无缓动 - 匀速线性变化
   * 适用于需要恒定速度的动画效果
   */
  Linear(amount: number): number {
    return amount;
  },

  /**
   * 二次方缓入 - 动画开始时缓慢，逐渐加速
   * 适用于物体启动、菜单展开等需要渐进感的效果
   */
  QuadIn(amount: number): number {
    return amount * amount;
  },

  /**
   * 二次方缓出 - 动画开始时快速，逐渐减速
   * 适用于物体停止、列表收起等需要自然减速的效果
   */
  QuadOut(amount: number): number {
    return amount * (2 - amount);
  },

  /**
   * 二次方缓入缓出 - 开始和结束时缓慢，中间加速
   * 适用于页面切换、模态框显隐等需要平滑过渡的效果
   */
  QuadInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v * v;
    return -0.5 * (--v * (v - 2) - 1);
  },

  /**
   * 三次方缓入 - 更强烈的缓入效果
   * 适用于需要更明显启动感的动画
   */
  CubicIn(amount: number): number {
    return amount * amount * amount;
  },

  /**
   * 三次方缓出 - 更强烈的缓出效果
   * 适用于需要更自然停止感的动画
   */
  CubicOut(amount: number): number {
    const v = amount - 1;
    return v ** 3 + 1;
  },

  /**
   * 三次方缓入缓出 - 更平滑的过渡效果
   * 适用于重要的界面转换动画
   */
  CubicInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v ** 3;
    v = v - 2;
    return 0.5 * (v ** 3 + 2);
  },

  /**
   * 四次方缓入 - 非常缓慢的启动效果
   * 适用于需要强调启动过程的动画
   */
  QuartIn(amount: number): number {
    return amount ** 4;
  },

  /**
   * 四次方缓出 - 非常自然的减速效果
   * 适用于需要柔和结束感的动画
   */
  QuartOut(amount: number): number {
    const v = amount - 1;
    return 1 - v ** 4;
  },

  /**
   * 四次方缓入缓出 - 非常平滑的过渡
   * 适用于高级界面动画效果
   */
  QuartInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v ** 4;
    v = v - 2;
    return -0.5 * (v ** 4 - 2);
  },

  /**
   * 五次方缓入 - 极其缓慢的启动
   * 适用于需要戏剧性启动效果的动画
   */
  QuintIn(amount: number): number {
    return amount * amount * amount * amount * amount;
  },

  /**
   * 五次方缓出 - 极其自然的减速
   * 适用于需要优雅结束感的动画
   */
  QuintOut(amount: number): number {
    const v = amount - 1;
    return v ** 5 + 1;
  },

  /**
   * 五次方缓入缓出 - 极其平滑的过渡
   * 适用于顶级用户体验的动画效果
   */
  QuintInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * v ** 5;
    v = v - 2;
    return 0.5 * (v ** 5 + 2);
  },

  /**
   * 正弦缓入 - 基于正弦函数的柔和启动
   * 适用于自然感强的动画效果
   */
  SineIn(amount: number): number {
    return 1 - Math.sin((1.0 - amount) * PI_2);
  },

  /**
   * 正弦缓出 - 基于正弦函数的柔和结束
   * 适用于需要轻柔感的动画效果
   */
  SineOut(amount: number): number {
    return Math.sin(amount * PI_2);
  },

  /**
   * 正弦缓入缓出 - 最自然的过渡效果之一
   * 适用于模拟真实世界物理运动的动画
   */
  SineInOut(amount: number): number {
    return 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)));
  },

  /**
   * 指数缓入 - 指数增长的启动效果
   * 适用于需要强烈加速感的动画
   */
  ExpoIn(amount: number): number {
    return amount === 0 ? 0 : 1024 ** (amount - 1);
  },

  /**
   * 指数缓出 - 指数衰减的结束效果
   * 适用于需要快速到达终点的动画
   */
  ExpoOut(amount: number): number {
    return amount === 1 ? 1 : 1 - 2 ** (-10 * amount);
  },

  /**
   * 指数缓入缓出 - 指数函数的平滑过渡
   * 适用于科技感强的界面动画
   */
  ExpoInOut(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    const v = amount * 2;
    if (v < 1) return 0.5 * 1024 ** (v - 1);
    return 0.5 * (-(2 ** (-10 * (v - 1))) + 2);
  },

  /**
   * 圆形缓入 - 基于圆形函数的启动
   * 适用于弧形运动的动画效果
   */
  CircIn(amount: number): number {
    return 1 - Math.sqrt(1 - amount * amount);
  },

  /**
   * 圆形缓出 - 基于圆形函数的结束
   * 适用于弧形轨迹的动画效果
   */
  CircOut(amount: number): number {
    const v = amount - 1;
    return Math.sqrt(1 - v * v);
  },

  /**
   * 圆形缓入缓出 - 圆弧形的平滑过渡
   * 适用于圆形界面元素的动画
   */
  CircInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return -0.5 * (Math.sqrt(1 - v * v) - 1);
    v = v - 2;
    return 0.5 * (Math.sqrt(1 - v * v) + 1);
  },

  /**
   * 弹性缓入 - 带弹性震动的启动效果
   * 适用于橡皮筋、弹簧类动画效果
   */
  ElasticIn(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    return -(2 ** (10 * (amount - 1))) * Math.sin((amount - 1.1) * 5 * Math.PI);
  },

  /**
   * 弹性缓出 - 带弹性震动的结束效果
   * 适用于按钮点击、卡片入场等需要活力感的动画
   */
  ElasticOut(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    return 2 ** (-10 * amount) * Math.sin((amount - 0.1) * 5 * Math.PI) + 1;
  },

  /**
   * 弹性缓入缓出 - 两端都有弹性效果
   * 适用于双向弹性交互动画
   */
  ElasticInOut(amount: number): number {
    if (amount === 0) return 0;
    if (amount === 1) return 1;
    const v = amount * 2;
    if (v < 1) return -0.5 * 2 ** (10 * (v - 1)) * Math.sin((v - 1.1) * 5 * Math.PI);
    return 0.5 * 2 ** (-10 * (v - 1)) * Math.sin((v - 0.1) * 5 * Math.PI) + 1;
  },

  /**
   * 回退缓入 - 先向后再向前的启动效果
   * 适用于模拟预备动作的动画
   */
  BackIn(amount: number): number {
    return amount === 1 ? 1 : amount * amount * ((BACK_FACTOR + 1) * amount - BACK_FACTOR);
  },

  /**
   * 回退缓出 - 超出目标后回退的结束效果
   * 适用于按钮、开关等需要回弹感的交互动画
   */
  BackOut(amount: number): number {
    const v = amount - 1;
    return amount === 0 ? 0 : v * v * ((BACK_FACTOR + 1) * v + BACK_FACTOR) + 1;
  },

  /**
   * 回退缓入缓出 - 两端都有回退效果
   * 适用于复杂的交互反馈动画
   */
  BackInOut(amount: number): number {
    let v = amount * 2;
    if (v < 1) return 0.5 * (v * v * ((BACK_FACTOR_INOUT + 1) * v - BACK_FACTOR_INOUT));
    v = v - 2;
    return 0.5 * (v * v * ((BACK_FACTOR_INOUT + 1) * v + BACK_FACTOR_INOUT) + 2);
  },

  /**
   * 弹跳缓入 - 反向弹跳启动效果
   * 适用于模拟球类运动的动画
   */
  BounceIn(amount: number): number {
    return 1 - Ease.BounceOut(1 - amount);
  },

  /**
   * 弹跳缓出 - 多次弹跳的结束效果
   * 适用于球体落地、按钮反馈等有趣的交互动画
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
   * 弹跳缓入缓出 - 两端都有弹跳效果
   * 适用于双向弹跳交互动画
   */
  BounceInOut(amount: number): number {
    if (amount < 0.5) return Ease.BounceIn(amount * 2) * 0.5;
    return Ease.BounceOut(amount * 2 - 1) * 0.5 + 0.5;
  },

  /**
   * 立即显示效果 - 瞬间从0跳到1
   * 适用于开关状态、即时显示等不需要过渡的场景
   */
  Immediately(amount: number): number {
    return amount > 0 ? 1 : 0;
  },

  /**
   * 脉搏跳动效果 - 0→1→0的正弦波动
   * 适用于心跳、脉冲、呼吸指示等循环动画
   */
  Pulse(amount: number): number {
    if (amount < 0.5) return Ease.SineIn(amount * 2);
    return 1 - Ease.SineOut((amount - 0.5) * 2);
  },

  /**
   * 果冻效果 - 带振荡的柔软变形
   * 适用于Q弹的UI元素、果冻状物体动画
   */
  Jelly(amount: number): number {
    if (amount < 0.5) return Math.sin(JELLY_FACTOR * Ease.SineIn(amount * 2));
    return Math.sin(JELLY_FACTOR * (1 - Ease.SineOut((amount - 0.5) * 2)));
  },

  /**
   * 冲撞反弹效果 - 0→1→0的强烈反弹
   * 适用于撞击、爆炸、强烈冲击等特效动画
   */
  Collision(amount: number): number {
    if (amount < 0.25) return Ease.QuartOut(amount * 4);
    return 1 - Ease.BounceOut(((amount - 0.25) * 4) / 3);
  },

  /**
   * 钟摆效果 - 0→1→0→1→0的匀速摆动
   * 适用于钟摆、秋千、摆动类动画
   */
  Pendulum(amount: number): number {
    if (amount < 0.25) return amount * 4;
    if (amount < 0.5) return 1 - (amount - 0.25) * 4;
    if (amount < 0.75) return (amount - 0.5) * 4;
    return 1 - (amount - 0.75) * 4;
  },

  /**
   * 心跳效果 - 0→1→0→1→0的双重跳动
   * 适用于心跳监测、生命体征、节拍类动画
   */
  Heart(amount: number): number {
    if (amount < 0.25) return Ease.QuadOut(amount * 4);
    if (amount < 0.5) return 1 - Ease.QuadIn((amount - 0.25) * 4);
    if (amount < 0.75) return Ease.QuadOut((amount - 0.5) * 4);
    return 1 - Ease.QuadIn((amount - 0.75) * 4);
  },

  /**
   * 呼吸效果 - 0→1→0→-1→0的完整呼吸循环
   * 适用于呼吸指导、冥想应用、放松类动画
   * 注意：输出值范围为 -1 到 1
   */
  Breathe(amount: number): number {
    if (amount < 0.25) return Ease.QuartOut(amount * 4);
    if (amount < 0.5) return 1 - Ease.QuadIn((amount - 0.25) * 4);
    if (amount < 0.75) return -Ease.QuartOut((amount - 0.5) * 4);
    return Ease.QuadIn((amount - 0.75) * 4) - 1;
  },

  /**
   * 波浪效果 - 连续的波浪起伏
   * 适用于水波、声波、频谱等波动类动画
   */
  Wave(amount: number): number {
    if (amount < 0.25) return amount * 4;
    if (amount < 0.5) return (amount - 0.25) * 4;
    if (amount < 0.75) return (amount - 0.5) * 4;
    return (amount - 0.75) * 4;
  },

  /**
   * 秋千递减震动效果 - 逐渐衰减的摆动
   * 适用于衰减振动、余震、减弱摆动等物理模拟
   * 注意：输出值可能超出 0-1 范围
   */
  Swing(amount: number): number {
    if (amount < 0.5) return Ease.Breathe(amount * 2);
    return Ease.Breathe((amount - 0.5) * 2) * 0.5;
  },

  /**
   * 故障闪烁效果 - 快速闪烁后平滑过渡
   * 适用于信号干扰、电子故障、科技感特效
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
   * 抖动效果 - 带衰减的高频震荡
   * 适用于地震、手抖、震动反馈等抖动类动画
   * 注意：输出值可能为负数
   */
  Shake(amount: number): number {
    const decay = 1 - amount;
    return Math.sin(amount * 30) * decay * decay;
  },
};

/**
 * 根据名称获取缓动函数
 * 提供字符串到缓动函数的动态映射，便于配置化使用
 *
 * @param name - 缓动函数名称，必须是 Ease 对象中的一个键
 * @returns 对应的缓动函数，如果未找到则返回 Linear 函数作为安全回退
 *
 * @注意事项 函数名称区分大小写，建议使用 TypeScript 获得智能提示
 */
export function getEase(name: string): EaseFunction {
  return (Ease as Record<string, EaseFunction>)[name] || Ease.Linear;
}
