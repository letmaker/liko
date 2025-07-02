import type { ParticleConfig } from './particle-config';
import { EmitterMode } from './particle-config';
import { ParticleData } from './particle-data';

/**
 * 粒子发射器
 * 负责根据配置创建和初始化新粒子
 */
export class ParticleEmitter {
  private config: ParticleConfig;
  private particlePool: ParticleData[] = [];
  private poolIndex = 0;

  /** 发射器位置 */
  position = { x: 0, y: 0 };

  /** 已运行时间 */
  elapsed = 0;

  /** 发射累积时间 */
  emitCounter = 0;

  /** 是否正在发射 */
  isEmitting = false;

  /**
   * 优化的随机数生成器（避免重复的Math.random调用）
   */
  private randomValues: Float32Array = new Float32Array(100);
  private randomIndex = 0;

  constructor(config: ParticleConfig) {
    this.config = config;
    this.initParticlePool();
  }

  /**
   * 初始化粒子对象池
   */
  private initParticlePool(): void {
    this.particlePool = [];
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.particlePool.push(new ParticleData());
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: ParticleConfig): void {
    this.config = config;
    if (this.particlePool.length < config.maxParticles) {
      // 扩展对象池
      const needCount = config.maxParticles - this.particlePool.length;
      for (let i = 0; i < needCount; i++) {
        this.particlePool.push(new ParticleData());
      }
    }
  }

  /**
   * 开始发射
   */
  start(): void {
    this.isEmitting = true;
    this.elapsed = 0;
    this.emitCounter = 0;
  }

  /**
   * 停止发射
   */
  stop(): void {
    this.isEmitting = false;
  }

  /**
   * 重置发射器
   */
  reset(): void {
    this.elapsed = 0;
    this.emitCounter = 0;
    this.poolIndex = 0;

    // 重置所有粒子
    for (const particle of this.particlePool) {
      particle.reset();
    }
  }

  /**
   * 设置发射器位置
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * 更新发射器
   * @param deltaTime - 时间间隔（秒）
   * @returns 新生成的粒子数组
   */
  update(deltaTime: number): ParticleData[] {
    const newParticles: ParticleData[] = [];

    if (!this.isEmitting) {
      return newParticles;
    }

    this.elapsed += deltaTime;

    // 检查是否需要停止发射（持续时间限制）
    if (this.config.duration !== -1 && this.elapsed >= this.config.duration) {
      this.stop();
      return newParticles;
    }

    // 计算需要发射的粒子数量
    const rate = 1.0 / this.config.emissionRate;
    this.emitCounter += deltaTime;

    while (this.emitCounter > rate) {
      const particle = this.getNextParticle();
      if (particle) {
        this.initParticle(particle);
        newParticles.push(particle);
      }
      this.emitCounter -= rate;
    }

    return newParticles;
  }

  /**
   * 从对象池获取下一个可用粒子
   */
  private getNextParticle(): ParticleData | null {
    // 使用简单的循环查找，避免重复取模运算
    const maxParticles = this.config.maxParticles;
    let startIndex = this.poolIndex;

    for (let i = 0; i < maxParticles; i++) {
      const particle = this.particlePool[startIndex];

      if (!particle.isAlive) {
        this.poolIndex = (startIndex + 1) % maxParticles;
        return particle;
      }

      startIndex = (startIndex + 1) % maxParticles;
    }

    return null; // 对象池已满
  }

  /**
   * 优化的随机数生成器（避免重复的Math.random调用）
   */
  private getRandomMinus1To1(): number {
    if (this.randomIndex >= this.randomValues.length) {
      // 批量生成随机数
      for (let i = 0; i < this.randomValues.length; i++) {
        this.randomValues[i] = Math.random() * 2 - 1;
      }
      this.randomIndex = 0;
    }
    return this.randomValues[this.randomIndex++];
  }

  /**
   * 初始化粒子
   */
  private initParticle(particle: ParticleData): void {
    const config = this.config;

    // 重置粒子
    particle.reset();

    // 设置生命周期
    particle.timeToLive = Math.max(
      0,
      config.particleLifespan + config.particleLifespanVariance * this.getRandomMinus1To1()
    );
    particle.totalTimeToLive = particle.timeToLive;

    // 设置位置（发射器位置 + 变化范围）
    particle.x = this.position.x + config.sourcePositionVarianceX * this.getRandomMinus1To1();
    particle.y = this.position.y + config.sourcePositionVarianceY * this.getRandomMinus1To1();

    // 设置大小
    const startSize = Math.max(
      0,
      config.startParticleSize + config.startParticleSizeVariance * this.getRandomMinus1To1()
    );
    const endSize = Math.max(
      0,
      config.finishParticleSize + config.finishParticleSizeVariance * this.getRandomMinus1To1()
    );
    particle.size = startSize;
    particle.sizeDelta = (endSize - startSize) / particle.timeToLive;

    // 设置颜色
    const startColor = {
      r: this.clamp(config.startColorRed + config.startColorVarianceRed * this.getRandomMinus1To1(), 0, 1),
      g: this.clamp(config.startColorGreen + config.startColorVarianceGreen * this.getRandomMinus1To1(), 0, 1),
      b: this.clamp(config.startColorBlue + config.startColorVarianceBlue * this.getRandomMinus1To1(), 0, 1),
      a: this.clamp(config.startColorAlpha + config.startColorVarianceAlpha * this.getRandomMinus1To1(), 0, 1),
    };

    const endColor = {
      r: this.clamp(config.finishColorRed + config.finishColorVarianceRed * this.getRandomMinus1To1(), 0, 1),
      g: this.clamp(config.finishColorGreen + config.finishColorVarianceGreen * this.getRandomMinus1To1(), 0, 1),
      b: this.clamp(config.finishColorBlue + config.finishColorVarianceBlue * this.getRandomMinus1To1(), 0, 1),
      a: this.clamp(config.finishColorAlpha + config.finishColorVarianceAlpha * this.getRandomMinus1To1(), 0, 1),
    };

    particle.r = startColor.r;
    particle.g = startColor.g;
    particle.b = startColor.b;
    particle.a = startColor.a;
    particle.dr = (endColor.r - startColor.r) / particle.timeToLive;
    particle.dg = (endColor.g - startColor.g) / particle.timeToLive;
    particle.db = (endColor.b - startColor.b) / particle.timeToLive;
    particle.da = (endColor.a - startColor.a) / particle.timeToLive;

    // 设置旋转
    const startRotation = config.rotationStart + config.rotationStartVariance * this.getRandomMinus1To1();
    const endRotation = config.rotationEnd + config.rotationEndVariance * this.getRandomMinus1To1();
    particle.rotation = startRotation;
    particle.rotationDelta = (endRotation - startRotation) / particle.timeToLive;

    // 根据发射器模式设置运动参数
    if (config.emitterMode === EmitterMode.GRAVITY) {
      this.initGravityParticle(particle);
    } else {
      this.initRadiusParticle(particle);
    }
  }

  /**
   * 初始化重力模式粒子
   */
  private initGravityParticle(particle: ParticleData): void {
    const config = this.config;

    // 设置重力
    particle.gx = config.gravityX;
    particle.gy = config.gravityY;

    // 设置初始速度（角度需要从度转换为弧度）
    const angleDegrees = config.angle + config.angleVariance * this.getRandomMinus1To1();
    const angleRadians = angleDegrees * (Math.PI / 180);
    const speed = config.speed + config.speedVariance * this.getRandomMinus1To1();

    particle.vx = Math.cos(angleRadians) * speed;
    particle.vy = Math.sin(angleRadians) * speed;

    // 设置加速度
    particle.radialAccel = config.radialAcceleration + config.radialAccelVariance * this.getRandomMinus1To1();
    particle.tangentialAccel =
      config.tangentialAcceleration + config.tangentialAccelVariance * this.getRandomMinus1To1();

    // 旋转是否等于方向
    if (config.rotationIsDir) {
      particle.rotation = angleRadians;
    }
  }

  /**
   * 初始化径向模式粒子
   */
  private initRadiusParticle(particle: ParticleData): void {
    const config = this.config;

    // 设置半径
    const maxRadius = Math.max(0, config.maxRadius + config.maxRadiusVariance * this.getRandomMinus1To1());
    const minRadius = Math.max(0, config.minRadius);

    particle.radius = maxRadius;
    particle.radiusDelta = (minRadius - maxRadius) / particle.timeToLive;

    // 设置角度（将度转换为弧度）
    const angleDegrees = config.angle + config.angleVariance * this.getRandomMinus1To1();
    particle.angle = angleDegrees * (Math.PI / 180);
    particle.angleDelta =
      (config.rotatePerSecond + config.rotatePerSecondVariance * this.getRandomMinus1To1()) * (Math.PI / 180);

    // 计算初始位置
    particle.x = this.position.x + Math.cos(particle.angle) * particle.radius;
    particle.y = this.position.y + Math.sin(particle.angle) * particle.radius;
  }

  /**
   * 限制数值范围
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 获取活跃粒子数量
   * 性能优化：使用for循环而不是for-of，避免迭代器开销
   */
  getActiveParticleCount(): number {
    let count = 0;
    for (let i = 0; i < this.particlePool.length; i++) {
      if (this.particlePool[i].isAlive) {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取所有活跃粒子
   * 性能优化：返回整个数组让调用者自行过滤，避免filter()创建新数组
   */
  getParticles(): ParticleData[] {
    return this.particlePool;
  }
}
