/**
 * 发射器模式枚举
 * 决定粒子的运动方式和物理表现
 */
export enum EmitterMode {
  /**
   * 重力模式 - 粒子受重力、速度、加速度影响
   * 适用场景：火焰、烟雾、雨雪、爆炸、喷泉等自然现象
   * 主要参数：gravity、speed、radialAcceleration、tangentialAcceleration
   */
  GRAVITY = 0,

  /**
   * 径向模式 - 粒子围绕中心点旋转和移动
   * 适用场景：光环、旋转特效、环绕效果、螺旋动画
   * 主要参数：maxRadius、minRadius、rotatePerSecond
   */
  RADIUS = 1,
}

/**
 * 位置类型枚举
 * 控制粒子相对于发射器的位置关系
 */
export enum PositionType {
  /**
   * 自由模式 - 粒子发射后完全独立，不受发射器移动影响
   * 适用场景：爆炸碎片、自由飘散的烟雾
   */
  FREE = 0,

  /**
   * 相对模式 - 粒子位置相对于发射器，随发射器移动
   * 适用场景：角色身上的光环、跟随效果
   */
  RELATIVE = 1,

  /**
   * 分组模式 - 粒子作为一个整体群组移动
   * 适用场景：整体移动的粒子云、编队效果
   */
  GROUPED = 2,
}

/**
 * WebGL 混合函数源因子
 * 控制当前粒子颜色如何与背景混合
 *
 * 常用组合：
 * - 正常混合：SRC_ALPHA + ONE_MINUS_SRC_ALPHA
 * - 加法混合：SRC_ALPHA + ONE (发光效果)
 * - 乘法混合：DST_COLOR + ZERO (阴影效果)
 */
export enum BlendFuncSource {
  ZERO = 0, // 不使用源颜色
  ONE = 1, // 完全使用源颜色
  SRC_COLOR = 768, // 使用源颜色
  ONE_MINUS_SRC_COLOR = 769, // 使用1-源颜色
  SRC_ALPHA = 770, // 使用源透明度 (推荐)
  ONE_MINUS_SRC_ALPHA = 771, // 使用1-源透明度
  DST_ALPHA = 772, // 使用目标透明度
  ONE_MINUS_DST_ALPHA = 773, // 使用1-目标透明度
  DST_COLOR = 774, // 使用目标颜色
  ONE_MINUS_DST_COLOR = 775, // 使用1-目标颜色
}

/**
 * WebGL 混合函数目标因子
 * 控制背景颜色如何参与混合计算
 */
export enum BlendFuncDestination {
  ZERO = 0, // 不使用目标颜色
  ONE = 1, // 完全使用目标颜色 (加法混合)
  SRC_COLOR = 768, // 使用源颜色
  ONE_MINUS_SRC_COLOR = 769, // 使用1-源颜色
  SRC_ALPHA = 770, // 使用源透明度
  ONE_MINUS_SRC_ALPHA = 771, // 使用1-源透明度 (正常混合，推荐)
  DST_ALPHA = 772, // 使用目标透明度
  ONE_MINUS_DST_ALPHA = 773, // 使用1-目标透明度
  DST_COLOR = 774, // 使用目标颜色
  ONE_MINUS_DST_COLOR = 775, // 使用1-目标颜色
}

/**
 * 粒子系统配置接口
 *
 * 注意事项：
 * 1. 所有角度单位为度数 (0-360)
 * 2. 所有颜色分量范围为 0.0-1.0
 * 3. variance 参数表示随机变化范围，会在 [value-variance, value+variance] 内随机
 * 4. 负数 duration 表示无限持续
 * 5. 性能考虑：maxParticles 建议不超过 1000
 */
export interface ParticleConfig {
  /**
   * 发射器模式：重力模式或径向模式
   * 这是最重要的配置，决定了粒子的基本行为模式
   */
  emitterMode: EmitterMode;

  /**
   * 位置类型：控制粒子与发射器的关系
   * FREE: 粒子独立移动，RELATIVE: 跟随发射器，GROUPED: 整体移动
   */
  positionType: PositionType;

  /**
   * 最大粒子数量
   * 建议值：50-500，过多会影响性能
   * 火焰效果：100-200，爆炸效果：200-500，环境效果：50-150
   */
  maxParticles: number;

  /**
   * 持续时间（秒）
   * -1: 无限持续，>0: 指定秒数后停止发射
   * 建议：爆炸等瞬间效果用1-3秒，环境效果用-1无限
   */
  duration: number;

  /**
   * 发射速率（粒子/秒）
   * 控制粒子生成的密集程度
   * 建议值：火焰 50-100，烟雾 20-50，爆炸 100-300
   */
  emissionRate: number;

  /**
   * 粒子生命周期（秒）
   * 每个粒子存在的时间长度
   * 建议值：火焰 0.5-2.0，烟雾 2.0-5.0，爆炸碎片 1.0-3.0
   */
  particleLifespan: number;

  /**
   * 粒子生命周期变化范围（秒）
   * 让粒子生命周期具有随机性，增加自然感
   * 通常设为 lifespan 的 10%-50%
   */
  particleLifespanVariance: number;

  /** 发射器X位置（像素） */
  sourcePositionX: number;

  /** 发射器Y位置（像素） */
  sourcePositionY: number;

  /**
   * 发射器X位置变化范围（像素）
   * 让粒子在发射器周围随机位置生成
   * 建议值：点状发射 0-10，线状发射 50-200
   */
  sourcePositionVarianceX: number;

  /**
   * 发射器Y位置变化范围（像素）
   * 配合 sourcePositionVarianceX 可创建矩形、椭圆等发射区域
   */
  sourcePositionVarianceY: number;

  /**
   * 初始大小（像素）
   * 粒子刚生成时的大小
   * 建议值：火花 2-8，火焰 16-32，烟雾 32-64
   */
  startParticleSize: number;

  /**
   * 初始大小变化范围（像素）
   * 让粒子初始大小具有随机性
   */
  startParticleSizeVariance: number;

  /**
   * 结束大小（像素）
   * 粒子消失时的大小，与初始大小不同可产生缩放动画
   * 火焰效果：通常比初始大小大，烟雾：通常比初始大小大，爆炸：通常比初始大小小
   */
  finishParticleSize: number;

  /** 结束大小变化范围（像素） */
  finishParticleSizeVariance: number;

  /**
   * 初始旋转角度（度）
   * 粒子生成时的旋转角度
   * 0-360，通常配合 rotationStartVariance 使用
   */
  rotationStart: number;

  /**
   * 初始旋转角度变化范围（度）
   * 建议值：360 (完全随机旋转)
   */
  rotationStartVariance: number;

  /**
   * 结束旋转角度（度）
   * 粒子消失时的旋转角度，与初始角度不同可产生旋转动画
   */
  rotationEnd: number;

  /** 结束旋转角度变化范围（度） */
  rotationEndVariance: number;

  /** 初始颜色红色分量 (0.0-1.0) */
  startColorRed: number;
  /** 初始颜色绿色分量 (0.0-1.0) */
  startColorGreen: number;
  /** 初始颜色蓝色分量 (0.0-1.0) */
  startColorBlue: number;
  /** 初始颜色透明度分量 (0.0-1.0) */
  startColorAlpha: number;

  /** 初始颜色红色分量变化范围 */
  startColorVarianceRed: number;
  /** 初始颜色绿色分量变化范围 */
  startColorVarianceGreen: number;
  /** 初始颜色蓝色分量变化范围 */
  startColorVarianceBlue: number;
  /** 初始颜色透明度分量变化范围 */
  startColorVarianceAlpha: number;

  /** 结束颜色红色分量 (0.0-1.0) */
  finishColorRed: number;
  /** 结束颜色绿色分量 (0.0-1.0) */
  finishColorGreen: number;
  /** 结束颜色蓝色分量 (0.0-1.0) */
  finishColorBlue: number;
  /** 结束颜色透明度分量 (0.0-1.0) */
  finishColorAlpha: number;

  /** 结束颜色红色分量变化范围 */
  finishColorVarianceRed: number;
  /** 结束颜色绿色分量变化范围 */
  finishColorVarianceGreen: number;
  /** 结束颜色蓝色分量变化范围 */
  finishColorVarianceBlue: number;
  /** 结束颜色透明度分量变化范围 */
  finishColorVarianceAlpha: number;

  /**
   * 重力X分量（像素/秒²）
   * 正值向右，负值向左
   * 建议值：火焰 0，雨雪 0，爆炸碎片 0-50
   */
  gravityX: number;

  /**
   * 重力Y分量（像素/秒²）
   * 正值向下，负值向上
   * 建议值：火焰 -200到-500，雨雪 200-500，爆炸向上 -100到-300
   */
  gravityY: number;

  /**
   * 初始速度（像素/秒）
   * 粒子发射时的速度大小
   * 建议值：火焰 20-100，爆炸 100-300，缓慢飘散 10-50
   */
  speed: number;

  /**
   * 初始速度变化范围（像素/秒）
   * 让粒子速度具有随机性
   * 通常设为 speed 的 20%-80%
   */
  speedVariance: number;

  /**
   * 径向加速度（像素/秒²）
   * 正值：粒子向外扩散，负值：粒子向中心聚集
   * 建议值：爆炸扩散 50-200，聚集效果 -50到-200
   */
  radialAcceleration: number;

  /** 径向加速度变化范围 */
  radialAccelVariance: number;

  /**
   * 切向加速度（像素/秒²）
   * 让粒子产生弯曲轨迹
   * 正值：顺时针弯曲，负值：逆时针弯曲
   * 建议值：螺旋效果 50-150，直线运动 0
   */
  tangentialAcceleration: number;

  /** 切向加速度变化范围 */
  tangentialAccelVariance: number;

  /**
   * 粒子发射角度（度）
   * 0: 向右，90: 向下，180: 向左，270: 向上
   * 配合 angleVariance 可控制发射扇形范围
   */
  angle: number;

  /**
   * 粒子发射角度变化范围（度）
   * 建议值：定向发射 0-30，扇形发射 30-90，全方向发射 180-360
   */
  angleVariance: number;

  /**
   * 旋转是否等于运动方向
   * true: 粒子自动旋转到面向运动方向（如子弹、箭头）
   * false: 粒子旋转独立于运动方向
   */
  rotationIsDir?: boolean;

  /**
   * 初始半径（像素）
   * 粒子距离发射器中心的初始距离
   * 建议值：小型光环 20-50，中型光环 50-150，大型光环 150-300
   */
  maxRadius: number;

  /** 初始半径变化范围（像素） */
  maxRadiusVariance: number;

  /**
   * 结束半径（像素）
   * 粒子消失时距离中心的距离
   * 小于初始半径：向内收缩，大于初始半径：向外扩散
   */
  minRadius: number;

  /**
   * 每秒旋转角度（度/秒）
   * 控制粒子围绕中心旋转的速度
   * 正值：顺时针，负值：逆时针
   * 建议值：缓慢旋转 30-90，快速旋转 180-360
   */
  rotatePerSecond: number;

  /** 每秒旋转角度变化范围（度/秒） */
  rotatePerSecondVariance: number;

  /**
   * 纹理文件名
   * 粒子使用的贴图文件路径
   * 支持 png, jpg 等格式
   */
  textureFileName?: string;

  /**
   * 纹理数据（base64编码）
   * 直接嵌入的图片数据，优先级高于 textureFileName
   */
  textureImageData?: string;

  /**
   * 混合函数源因子
   * 推荐组合：
   * - 正常效果：SRC_ALPHA
   * - 发光效果：SRC_ALPHA (配合 ONE)
   * - 阴影效果：DST_COLOR
   */
  blendFuncSource: BlendFuncSource;

  /**
   * 混合函数目标因子
   * 推荐组合：
   * - 正常效果：ONE_MINUS_SRC_ALPHA
   * - 发光效果：ONE
   * - 阴影效果：ZERO
   */
  blendFuncDestination: BlendFuncDestination;
}

/**
 * 粒子配置选项接口
 * 提供更便捷的颜色配置方式
 */
export interface ParticleConfigOptions extends Partial<ParticleConfig> {
  /**
   * 初始颜色（便捷设置）
   * 例：{ r: 1, g: 0.5, b: 0, a: 1 } 表示橙色
   */
  startColor?: { r: number; g: number; b: number; a: number };

  /**
   * 结束颜色（便捷设置）
   * 例：{ r: 1, g: 0, b: 0, a: 0 } 表示红色渐变到透明
   */
  finishColor?: { r: number; g: number; b: number; a: number };
}

/**
 * 默认粒子系统配置
 */
export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  // 基础配置
  emitterMode: EmitterMode.GRAVITY,
  positionType: PositionType.FREE,
  maxParticles: 300,
  duration: -1,
  emissionRate: 30,

  // 生命周期
  particleLifespan: 1,
  particleLifespanVariance: 0,

  // 发射器位置
  sourcePositionX: 0,
  sourcePositionY: 0,
  sourcePositionVarianceX: 0,
  sourcePositionVarianceY: 0,

  // 粒子大小
  startParticleSize: 32,
  startParticleSizeVariance: 0,
  finishParticleSize: 32,
  finishParticleSizeVariance: 0,

  // 粒子旋转
  rotationStart: 0,
  rotationStartVariance: 0,
  rotationEnd: 0,
  rotationEndVariance: 0,

  // 初始颜色：白色不透明
  startColorRed: 1,
  startColorGreen: 1,
  startColorBlue: 1,
  startColorAlpha: 1,
  startColorVarianceRed: 0,
  startColorVarianceGreen: 0,
  startColorVarianceBlue: 0,
  startColorVarianceAlpha: 0,

  // 结束颜色：白色透明（产生淡出效果）
  finishColorRed: 1,
  finishColorGreen: 1,
  finishColorBlue: 1,
  finishColorAlpha: 0,
  finishColorVarianceRed: 0,
  finishColorVarianceGreen: 0,
  finishColorVarianceBlue: 0,
  finishColorVarianceAlpha: 0,

  // 重力模式参数
  gravityX: 0,
  gravityY: 0,
  speed: 100,
  speedVariance: 30,
  radialAcceleration: 0,
  radialAccelVariance: 0,
  tangentialAcceleration: 0,
  tangentialAccelVariance: 0,
  angle: 0,
  angleVariance: 360,
  rotationIsDir: false,

  // 径向模式参数
  maxRadius: 0,
  maxRadiusVariance: 0,
  minRadius: 0,
  rotatePerSecond: 0,
  rotatePerSecondVariance: 0,

  // 渲染属性：正常混合模式
  blendFuncSource: BlendFuncSource.SRC_ALPHA,
  blendFuncDestination: BlendFuncDestination.ONE_MINUS_SRC_ALPHA,
};
