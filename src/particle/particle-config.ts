/** 发射器模式 */
export enum EmitterMode {
  /** 重力模式 */
  GRAVITY = 0,
  /** 径向模式 */
  RADIUS = 1,
}

/** 位置类型 */
export enum PositionType {
  /** 自由模式 */
  FREE = 0,
  /** 相对模式 */
  RELATIVE = 1,
  /** 分组模式 */
  GROUPED = 2,
}

/** 混合函数源 */
export enum BlendFuncSource {
  ZERO = 0,
  ONE = 1,
  SRC_COLOR = 768,
  ONE_MINUS_SRC_COLOR = 769,
  SRC_ALPHA = 770,
  ONE_MINUS_SRC_ALPHA = 771,
  DST_ALPHA = 772,
  ONE_MINUS_DST_ALPHA = 773,
  DST_COLOR = 774,
  ONE_MINUS_DST_COLOR = 775,
}

/** 混合函数目标 */
export enum BlendFuncDestination {
  ZERO = 0,
  ONE = 1,
  SRC_COLOR = 768,
  ONE_MINUS_SRC_COLOR = 769,
  SRC_ALPHA = 770,
  ONE_MINUS_SRC_ALPHA = 771,
  DST_ALPHA = 772,
  ONE_MINUS_DST_ALPHA = 773,
  DST_COLOR = 774,
  ONE_MINUS_DST_COLOR = 775,
}

/** 粒子系统配置接口 */
export interface ParticleConfig {
  // 基础配置
  /** 发射器模式：重力模式或径向模式 */
  emitterMode: EmitterMode;

  /** 位置类型 */
  positionType: PositionType;

  /** 最大粒子数量 */
  maxParticles: number;

  /** 持续时间（秒），-1 表示无限 */
  duration: number;

  /** 发射速率（粒子/秒） */
  emissionRate: number;

  // 粒子生命周期
  /** 粒子生命周期（秒） */
  particleLifespan: number;

  /** 粒子生命周期变化范围 */
  particleLifespanVariance: number;

  // 发射器位置
  /** 发射器X位置 */
  sourcePositionX: number;

  /** 发射器Y位置 */
  sourcePositionY: number;

  /** 发射器X位置变化范围 */
  sourcePositionVarianceX: number;

  /** 发射器Y位置变化范围 */
  sourcePositionVarianceY: number;

  // 粒子大小
  /** 初始大小 */
  startParticleSize: number;

  /** 初始大小变化范围 */
  startParticleSizeVariance: number;

  /** 结束大小 */
  finishParticleSize: number;

  /** 结束大小变化范围 */
  finishParticleSizeVariance: number;

  // 粒子旋转
  /** 初始旋转角度 */
  rotationStart: number;

  /** 初始旋转角度变化范围 */
  rotationStartVariance: number;

  /** 结束旋转角度 */
  rotationEnd: number;

  /** 结束旋转角度变化范围 */
  rotationEndVariance: number;

  // 粒子颜色
  /** 初始颜色红色分量 */
  startColorRed: number;

  /** 初始颜色绿色分量 */
  startColorGreen: number;

  /** 初始颜色蓝色分量 */
  startColorBlue: number;

  /** 初始颜色透明度分量 */
  startColorAlpha: number;

  /** 初始颜色红色分量变化范围 */
  startColorVarianceRed: number;

  /** 初始颜色绿色分量变化范围 */
  startColorVarianceGreen: number;

  /** 初始颜色蓝色分量变化范围 */
  startColorVarianceBlue: number;

  /** 初始颜色透明度分量变化范围 */
  startColorVarianceAlpha: number;

  /** 结束颜色红色分量 */
  finishColorRed: number;

  /** 结束颜色绿色分量 */
  finishColorGreen: number;

  /** 结束颜色蓝色分量 */
  finishColorBlue: number;

  /** 结束颜色透明度分量 */
  finishColorAlpha: number;

  /** 结束颜色红色分量变化范围 */
  finishColorVarianceRed: number;

  /** 结束颜色绿色分量变化范围 */
  finishColorVarianceGreen: number;

  /** 结束颜色蓝色分量变化范围 */
  finishColorVarianceBlue: number;

  /** 结束颜色透明度分量变化范围 */
  finishColorVarianceAlpha: number;

  // 重力模式参数
  /** 重力X */
  gravityX: number;

  /** 重力Y */
  gravityY: number;

  /** 速度 */
  speed: number;

  /** 速度变化范围 */
  speedVariance: number;

  /** 径向加速度 */
  radialAcceleration: number;

  /** 径向加速度变化范围 */
  radialAccelVariance: number;

  /** 切向加速度 */
  tangentialAcceleration: number;

  /** 切向加速度变化范围 */
  tangentialAccelVariance: number;

  /** 粒子发射角度 */
  angle: number;

  /** 粒子发射角度变化范围 */
  angleVariance: number;

  /** 旋转是否等于方向 */
  rotationIsDir?: boolean;

  // 径向模式参数
  /** 初始半径 */
  maxRadius: number;

  /** 初始半径变化范围 */
  maxRadiusVariance: number;

  /** 结束半径 */
  minRadius: number;

  /** 每秒旋转角度 */
  rotatePerSecond: number;

  /** 每秒旋转角度变化范围 */
  rotatePerSecondVariance: number;

  // 渲染属性
  /** 纹理文件名 */
  textureFileName?: string;

  /** 纹理数据（base64编码） */
  textureImageData?: string;

  /** 混合函数源 */
  blendFuncSource: BlendFuncSource;

  /** 混合函数目标 */
  blendFuncDestination: BlendFuncDestination;
}

export interface ParticleConfigOptions extends Partial<ParticleConfig> {
  /** 初始颜色 */
  startColor?: { r: number; g: number; b: number; a: number };

  /** 结束颜色 */
  finishColor?: { r: number; g: number; b: number; a: number };
}

/** 默认粒子系统配置 */
export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  emitterMode: EmitterMode.GRAVITY,
  positionType: PositionType.FREE,
  maxParticles: 300,
  duration: -1,
  emissionRate: 30,

  particleLifespan: 1,
  particleLifespanVariance: 0,

  sourcePositionX: 0,
  sourcePositionY: 0,
  sourcePositionVarianceX: 0,
  sourcePositionVarianceY: 0,

  startParticleSize: 32,
  startParticleSizeVariance: 0,
  finishParticleSize: 32,
  finishParticleSizeVariance: 0,

  rotationStart: 0,
  rotationStartVariance: 0,
  rotationEnd: 0,
  rotationEndVariance: 0,

  startColorRed: 1,
  startColorGreen: 1,
  startColorBlue: 1,
  startColorAlpha: 1,
  startColorVarianceRed: 0,
  startColorVarianceGreen: 0,
  startColorVarianceBlue: 0,
  startColorVarianceAlpha: 0,

  finishColorRed: 1,
  finishColorGreen: 1,
  finishColorBlue: 1,
  finishColorAlpha: 0,
  finishColorVarianceRed: 0,
  finishColorVarianceGreen: 0,
  finishColorVarianceBlue: 0,
  finishColorVarianceAlpha: 0,

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

  maxRadius: 0,
  maxRadiusVariance: 0,
  minRadius: 0,
  rotatePerSecond: 0,
  rotatePerSecondVariance: 0,

  blendFuncSource: BlendFuncSource.SRC_ALPHA,
  blendFuncDestination: BlendFuncDestination.ONE_MINUS_SRC_ALPHA,
};
