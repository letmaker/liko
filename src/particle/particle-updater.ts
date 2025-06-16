import type { ParticleConfig } from './particle-config';
import { EmitterMode } from './particle-config';
import type { ParticleData } from './particle-data';

/**
 * 粒子更新器
 * 负责每帧更新粒子的位置、颜色、大小等属性
 */
export class ParticleUpdater {
  private config: ParticleConfig;

  constructor(config: ParticleConfig) {
    this.config = config;
  }

  /**
   * 更新配置
   */
  updateConfig(config: ParticleConfig): void {
    this.config = config;
  }

  /**
   * 更新单个粒子
   * @param particle - 要更新的粒子
   * @param deltaTime - 时间间隔（秒）
   * @param emitterPosition - 发射器位置（用于径向模式）
   * @returns 粒子是否仍然存活
   */
  updateParticle(particle: ParticleData, deltaTime: number, emitterPosition: { x: number; y: number }): boolean {
    // 减少生命时间
    particle.timeToLive -= deltaTime;

    // 检查粒子是否死亡
    if (particle.timeToLive <= 0) {
      return false;
    }

    // 更新颜色
    this.updateColor(particle, deltaTime);

    // 更新大小
    this.updateSize(particle, deltaTime);

    // 更新旋转
    this.updateRotation(particle, deltaTime);

    // 根据发射器模式更新位置
    if (this.config.emitterMode === EmitterMode.GRAVITY) {
      this.updateGravityParticle(particle, deltaTime);
    } else {
      this.updateRadiusParticle(particle, deltaTime, emitterPosition);
    }

    return true;
  }

  /**
   * 批量更新粒子
   * @param particles - 粒子数组
   * @param deltaTime - 时间间隔（秒）
   * @param emitterPosition - 发射器位置
   * @returns 存活的粒子数量
   */
  updateParticles(particles: ParticleData[], deltaTime: number, emitterPosition: { x: number; y: number }): number {
    let aliveCount = 0;

    // 预计算常用值
    const gravityX = this.config.gravityX;
    const gravityY = this.config.gravityY;
    const isGravityMode = this.config.emitterMode === EmitterMode.GRAVITY;
    const rotationIsDir = this.config.rotationIsDir || false;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      if (!particle.isAlive) continue;

      // 减少生命时间
      particle.timeToLive -= deltaTime;

      // 检查粒子是否死亡
      if (particle.timeToLive <= 0) {
        continue;
      }

      // 更新颜色（内联避免函数调用）
      particle.r = this.clampColor(particle.r + particle.dr * deltaTime);
      particle.g = this.clampColor(particle.g + particle.dg * deltaTime);
      particle.b = this.clampColor(particle.b + particle.db * deltaTime);
      particle.a = this.clampColor(particle.a + particle.da * deltaTime);

      // 更新大小
      particle.size = Math.max(0, particle.size + particle.sizeDelta * deltaTime);

      // 更新旋转
      particle.rotation += particle.rotationDelta * deltaTime;

      // 根据发射器模式更新位置
      if (isGravityMode) {
        this.updateGravityParticleInline(particle, deltaTime, gravityX, gravityY, rotationIsDir);
      } else {
        this.updateRadiusParticleInline(particle, deltaTime, emitterPosition);
      }

      aliveCount++;
    }

    return aliveCount;
  }

  /**
   * 更新粒子颜色
   */
  private updateColor(particle: ParticleData, deltaTime: number): void {
    particle.r += particle.dr * deltaTime;
    particle.g += particle.dg * deltaTime;
    particle.b += particle.db * deltaTime;
    particle.a += particle.da * deltaTime;

    // 确保颜色值在合法范围内
    particle.r = this.clamp(particle.r, 0, 1);
    particle.g = this.clamp(particle.g, 0, 1);
    particle.b = this.clamp(particle.b, 0, 1);
    particle.a = this.clamp(particle.a, 0, 1);
  }

  /**
   * 更新粒子大小
   */
  private updateSize(particle: ParticleData, deltaTime: number): void {
    particle.size += particle.sizeDelta * deltaTime;
    particle.size = Math.max(0, particle.size); // 确保大小不为负数
  }

  /**
   * 更新粒子旋转
   */
  private updateRotation(particle: ParticleData, deltaTime: number): void {
    particle.rotation += particle.rotationDelta * deltaTime;
  }

  /**
   * 更新重力模式粒子
   */
  private updateGravityParticle(particle: ParticleData, deltaTime: number): void {
    // 计算径向向量（从粒子到发射器的方向）
    const radialX = particle.x;
    const radialY = particle.y;

    // 归一化径向向量
    const radialLength = Math.sqrt(radialX * radialX + radialY * radialY);

    let normalizedRadialX = 0;
    let normalizedRadialY = 0;

    if (radialLength > 0) {
      normalizedRadialX = radialX / radialLength;
      normalizedRadialY = radialY / radialLength;
    }

    // 计算切向向量（垂直于径向向量）
    const tangentialX = -normalizedRadialY;
    const tangentialY = normalizedRadialX;

    // 应用径向加速度
    particle.vx += normalizedRadialX * particle.radialAccel * deltaTime;
    particle.vy += normalizedRadialY * particle.radialAccel * deltaTime;

    // 应用切向加速度
    particle.vx += tangentialX * particle.tangentialAccel * deltaTime;
    particle.vy += tangentialY * particle.tangentialAccel * deltaTime;

    // 应用重力
    particle.vx += particle.gx * deltaTime;
    particle.vy += particle.gy * deltaTime;

    // 更新位置
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;

    // 如果旋转等于方向，更新旋转角度
    if (this.config.rotationIsDir) {
      particle.rotation = Math.atan2(particle.vy, particle.vx);
    }
  }

  /**
   * 更新径向模式粒子
   */
  private updateRadiusParticle(
    particle: ParticleData,
    deltaTime: number,
    emitterPosition: { x: number; y: number }
  ): void {
    // 更新角度
    particle.angle += particle.angleDelta * deltaTime;

    // 更新半径
    particle.radius += particle.radiusDelta * deltaTime;
    particle.radius = Math.max(0, particle.radius); // 确保半径不为负数

    // 计算新位置
    particle.x = emitterPosition.x + Math.cos(particle.angle) * particle.radius;
    particle.y = emitterPosition.y + Math.sin(particle.angle) * particle.radius;
  }

  /**
   * 限制数值范围
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 根据生命周期百分比插值计算颜色（可选的高级功能）
   */
  interpolateColor(particle: ParticleData): { r: number; g: number; b: number; a: number } {
    const lifePercent = particle.lifePercent;

    // 使用线性插值计算当前颜色
    const startColor = {
      r: this.config.startColorRed,
      g: this.config.startColorGreen,
      b: this.config.startColorBlue,
      a: this.config.startColorAlpha,
    };

    const endColor = {
      r: this.config.finishColorRed,
      g: this.config.finishColorGreen,
      b: this.config.finishColorBlue,
      a: this.config.finishColorAlpha,
    };

    return {
      r: this.lerp(startColor.r, endColor.r, lifePercent),
      g: this.lerp(startColor.g, endColor.g, lifePercent),
      b: this.lerp(startColor.b, endColor.b, lifePercent),
      a: this.lerp(startColor.a, endColor.a, lifePercent),
    };
  }

  /**
   * 根据生命周期百分比插值计算大小（可选的高级功能）
   */
  interpolateSize(particle: ParticleData): number {
    const lifePercent = particle.lifePercent;
    return this.lerp(this.config.startParticleSize, this.config.finishParticleSize, lifePercent);
  }

  /**
   * 线性插值
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * 内联重力模式粒子更新（避免函数调用开销）
   */
  private updateGravityParticleInline(
    particle: ParticleData,
    deltaTime: number,
    gravityX: number,
    gravityY: number,
    rotationIsDir: boolean
  ): void {
    // 计算径向向量（从粒子到发射器的方向）
    const radialX = particle.x;
    const radialY = particle.y;
    const radialLength = Math.sqrt(radialX * radialX + radialY * radialY);

    if (radialLength > 0) {
      const invRadialLength = 1 / radialLength;
      const normalizedRadialX = radialX * invRadialLength;
      const normalizedRadialY = radialY * invRadialLength;

      // 计算切向向量（垂直于径向向量）
      const tangentialX = -normalizedRadialY;
      const tangentialY = normalizedRadialX;

      // 应用径向和切向加速度
      particle.vx += (normalizedRadialX * particle.radialAccel + tangentialX * particle.tangentialAccel) * deltaTime;
      particle.vy += (normalizedRadialY * particle.radialAccel + tangentialY * particle.tangentialAccel) * deltaTime;
    }

    // 应用重力
    particle.vx += gravityX * deltaTime;
    particle.vy += gravityY * deltaTime;

    // 更新位置
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;

    // 如果旋转等于方向，更新旋转角度
    if (rotationIsDir) {
      particle.rotation = Math.atan2(particle.vy, particle.vx);
    }
  }

  /**
   * 内联径向模式粒子更新
   */
  private updateRadiusParticleInline(
    particle: ParticleData,
    deltaTime: number,
    emitterPosition: { x: number; y: number }
  ): void {
    // 更新角度和半径
    particle.angle += particle.angleDelta * deltaTime;
    particle.radius = Math.max(0, particle.radius + particle.radiusDelta * deltaTime);

    // 计算新位置
    const cos = Math.cos(particle.angle);
    const sin = Math.sin(particle.angle);
    particle.x = emitterPosition.x + cos * particle.radius;
    particle.y = emitterPosition.y + sin * particle.radius;
  }

  /**
   * 优化的颜色夹紧函数
   */
  private clampColor(value: number): number {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }
}
