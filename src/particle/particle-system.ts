import { DirtyType, EventType } from '../const';
import { loader } from '../loader';
import type { Bounds } from '../math/bounds';
import type { INodeOptions } from '../nodes/node';
import { type INodePrivateProps, LikoNode } from '../nodes/node';
import type { IRenderable } from '../nodes/sprite';
import { Texture } from '../resource/texture';
import { RegNode } from '../utils/decorators';
import { ParticleRenderObject } from './particle-render-object';

import type { ParticleConfig, ParticleConfigOptions } from './particle-config';
import { DEFAULT_PARTICLE_CONFIG } from './particle-config';
import { ParticleEmitter } from './particle-emitter';
import { ParticleUpdater } from './particle-updater';
import { PlistParser } from './plist-parser';

/** 粒子系统渲染接口 */
export interface IParticleRenderable extends IRenderable {
  config: ParticleConfig;
}

interface IParticleSystemPrivateProps extends INodePrivateProps {
  url: string;
  texture?: Texture;
  config: ParticleConfig;
}

interface IParticleSystemOptions extends INodeOptions {
  /** 粒子配置文件URL（plist格式） */
  url?: string;
  /** 粒子纹理 */
  texture?: Texture;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 粒子配置 */
  config?: ParticleConfigOptions;
}

/**
 * 粒子系统组件
 *
 * 完整的2D粒子系统实现，兼容cocos-engine的plist格式配置文件。
 * 支持重力模式和径向模式两种发射器类型，提供丰富的粒子效果。
 *
 * ## 基础使用示例：
 * ```typescript
 * // 1. 通过plist配置文件创建粒子系统
 * const fireParticle = new ParticleSystem({
 *   url: 'assets/effects/fire.plist',
 *   position: { x: 400, y: 300 },
 *   autoPlay: true
 * });
 *
 * // 2. 通过配置对象创建粒子系统
 * const customParticle = new ParticleSystem({
 *   config: {
 *     emitterMode: EmitterMode.GRAVITY,
 *     maxParticles: 100,
 *     emissionRate: 50,
 *     particleLifespan: 2.0
 *   },
 *   position: { x: 500, y: 500 },
 * });
 *
 * // 添加到场景
 * stage.addChild(customParticle);
 * customParticle.play();
 * ```
 *
 * ## 控制粒子播放：
 * ```typescript
 * // 播放控制
 * particle.play();         // 开始播放
 * particle.stop();         // 停止发射（现有粒子继续运行）
 * particle.pause();        // 暂停整个系统
 * particle.resume();       // 恢复播放
 * particle.reset();        // 重置系统
 *
 * // 状态查询
 * console.log(particle.isPlaying);      // 是否正在播放
 * console.log(particle.isPaused);       // 是否已暂停
 * console.log(particle.particleCount);  // 当前粒子数量
 * ```
 *
 * ## 动态修改配置：
 * ```typescript
 * // 修改发射速率
 * particle.setEmissionRate(100);
 *
 * // 修改粒子颜色
 * particle.setStartColor({ r: 1, g: 0, b: 0, a: 1 }); // 红色
 * particle.setEndColor({ r: 1, g: 1, b: 0, a: 0 });   // 透明黄色
 *
 * // 修改粒子大小
 * particle.setParticleSize(32, 64); // 起始32，结束64
 *
 * // 修改重力
 * particle.setGravity(0, 98); // 向下重力
 * ```
 *
 * ## 事件监听：
 * ```typescript
 * // 监听配置加载完成
 * particle.on(EventType.loaded, () => {
 *   console.log('粒子配置加载完成');
 *   particle.play();
 * });
 *
 * // 监听播放结束（仅限有限时长的粒子）
 * particle.on('complete', () => {
 *   console.log('粒子播放结束');
 * });
 * ```
 *
 * ## 注意事项：
 * - 必须先将粒子系统添加到舞台（stage）后才能调用 play() 方法
 * - 通过 url 加载配置时，会自动尝试加载配置中指定的纹理文件
 * - 如果不指定纹理，系统会使用默认的白色纹理用于纯色渲染
 */
@RegNode('ParticleSystem')
export class ParticleSystem extends LikoNode implements IParticleRenderable {
  declare pp: IParticleSystemPrivateProps;
  readonly renderObject: ParticleRenderObject = new ParticleRenderObject(this);

  private _emitter: ParticleEmitter;
  private _updater: ParticleUpdater;

  /**
   * 粒子系统是否正在播放
   * @readonly 通过 play() 和 stop() 方法控制此状态
   */
  isPlaying = false;

  /**
   * 粒子系统是否已暂停
   * @readonly 通过 pause() 和 resume() 方法控制此状态
   */
  isPaused = false;

  /**
   * 是否在添加到舞台时自动播放
   */
  autoPlay = false;

  /**
   * 创建粒子系统实例
   * @param options 粒子系统配置选项或直接的粒子配置对象
   */
  constructor(options?: IParticleSystemOptions) {
    super();

    const config: ParticleConfig = { ...DEFAULT_PARTICLE_CONFIG };

    // 初始化私有属性
    this.pp.texture = Texture.WHITE;
    this.pp.config = config;

    // 初始化组件
    this._emitter = new ParticleEmitter(config);
    this._updater = new ParticleUpdater(config);

    this.setProps(options as Record<string, unknown>);

    if (options?.autoPlay) {
      if (this.stage) {
        this.play();
      } else {
        this.once(EventType.addedToStage, () => {
          this.play();
        });
      }
    }
  }

  /**
   * 当前粒子配置对象，包含所有粒子行为的配置参数
   */
  get config(): ParticleConfig {
    return this.pp.config;
  }
  set config(value: ParticleConfigOptions) {
    const config: ParticleConfig = {
      ...DEFAULT_PARTICLE_CONFIG,
      ...value,
    };

    if (value.startColor) {
      config.startColorRed = value.startColor.r;
      config.startColorGreen = value.startColor.g;
      config.startColorBlue = value.startColor.b;
      config.startColorAlpha = value.startColor.a;
    }
    if (value.finishColor) {
      config.finishColorRed = value.finishColor.r;
      config.finishColorGreen = value.finishColor.g;
      config.finishColorBlue = value.finishColor.b;
      config.finishColorAlpha = value.finishColor.a;
    }

    this.pp.config = config;
    this._emitter.updateConfig(config);
    this._updater.updateConfig(config);
    this.markDirty(DirtyType.child);
  }

  /**
   * 获取当前配置文件的URL，仅在通过URL加载配置时有值
   */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    if (this.pp.url !== value) {
      this.pp.url = value;
      this.load(value);
    }
  }

  /**
   * 获取粒子使用的纹理，如果未设置会返回默认的白色纹理
   */
  get texture(): Texture {
    return this.pp.texture ?? Texture.WHITE;
  }
  set texture(value: Texture | undefined) {
    if (this.pp.texture !== value) {
      this.pp.texture = value;
      this.renderObject.updateTexture(value);
      this.markDirty(DirtyType.texture);
    }
  }

  /**
   * 获取当前活跃粒子的数量，实时反映系统中正在运行的粒子数量
   */
  get particleCount(): number {
    return this._emitter.getActiveParticleCount();
  }

  /**
   * 异步加载plist格式的粒子配置文件
   * 会解析配置并尝试加载配置中指定的纹理文件
   * @param url 配置文件的URL路径
   * @throws 加载失败时抛出错误
   */
  async load(url: string): Promise<void> {
    try {
      // 加载plist文件
      const plistContent = await loader.load<string>(url);
      if (!plistContent) {
        throw new Error(`Failed to load plist content from: ${url}`);
      }

      // 解析配置
      const config = PlistParser.parseParticleConfig(plistContent);

      // 更新配置
      this.config = config;

      // 加载纹理（如果配置中指定了）
      if (config.textureFileName && this.pp.texture === Texture.WHITE) {
        const textureUrl = this._resolveTextureUrl(url, config.textureFileName);
        try {
          const texture = await loader.load<Texture>(textureUrl);
          this.texture = texture;
        } catch (textureError) {
          console.warn('Failed to load particle texture:', textureError);
        }
      }

      // 触发加载完成事件
      this.emit(EventType.loaded);

      // 如果设置了自动播放，开始播放
      if (this.autoPlay) {
        this.play();
      }
    } catch (error) {
      console.error('Failed to load particle config:', error);
    }
  }

  /**
   * 解析纹理文件URL
   * 根据plist文件路径和纹理文件名生成完整的纹理URL
   * @param plistUrl plist配置文件的URL
   * @param textureFileName 纹理文件名
   * @returns 完整的纹理文件URL
   */
  private _resolveTextureUrl(plistUrl: string, textureFileName: string): string {
    const plistDir = plistUrl.substring(0, plistUrl.lastIndexOf('/') + 1);
    return plistDir + textureFileName;
  }

  /**
   * 开始播放粒子系统
   * 注意：必须先将粒子系统添加到舞台后才能调用此方法
   */
  play(): void {
    if (!this.stage) {
      console.error('ParticleSystem: stage is undefined, cannot play');
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this._emitter.start();

    // 绑定onUpdate方法到正确的上下文
    this.stage.timer.onFrame(this.onUpdate, this);
  }

  /**
   * 停止发射新粒子
   * 现有的粒子会继续运行直到生命周期结束
   */
  stop(): void {
    this.isPlaying = false;
    this._emitter.stop();
  }

  /**
   * 暂停整个粒子系统
   * 暂停时粒子不会更新位置和状态，但仍会渲染
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复暂停的粒子系统
   * 继续更新所有粒子的状态和位置
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * 重置粒子系统到初始状态
   * 清除所有现有粒子，停止播放和发射
   */
  reset(): void {
    this._emitter.reset();
    this.isPlaying = false;
    this.isPaused = false;
  }

  /**
   * 设置粒子发射速率
   * 立即生效，影响后续的粒子发射频率
   * @param rate 每秒发射的粒子数量
   */
  setEmissionRate(rate: number): void {
    this.pp.config.emissionRate = rate;
    this._emitter.updateConfig(this.pp.config);
  }

  /**
   * 设置粒子生命周期
   * 控制每个粒子存活的时间长度
   * @param lifespan 基础生命周期时长（秒）
   * @param variance 生命周期的随机变化范围（秒），默认为0
   */
  setParticleLifespan(lifespan: number, variance = 0): void {
    this.pp.config.particleLifespan = lifespan;
    this.pp.config.particleLifespanVariance = variance;
    this._emitter.updateConfig(this.pp.config);
  }

  /**
   * 设置粒子的起始颜色
   * 影响新发射粒子的初始颜色
   * @param color 颜色对象，包含 r、g、b、a 分量，值域为 0-1
   */
  setStartColor(color: { r: number; g: number; b: number; a: number }): void {
    this.pp.config.startColorRed = color.r;
    this.pp.config.startColorGreen = color.g;
    this.pp.config.startColorBlue = color.b;
    this.pp.config.startColorAlpha = color.a;
    this._emitter.updateConfig(this.pp.config);
  }

  /**
   * 设置粒子的结束颜色
   * 粒子会在生命周期内从起始颜色渐变到结束颜色
   * @param color 颜色对象，包含 r、g、b、a 分量，值域为 0-1
   */
  setEndColor(color: { r: number; g: number; b: number; a: number }): void {
    this.pp.config.finishColorRed = color.r;
    this.pp.config.finishColorGreen = color.g;
    this.pp.config.finishColorBlue = color.b;
    this.pp.config.finishColorAlpha = color.a;
    this._emitter.updateConfig(this.pp.config);
  }

  /**
   * 设置粒子大小
   * 粒子会在生命周期内从起始大小缩放到结束大小
   * @param startSize 粒子的起始大小（像素）
   * @param endSize 粒子的结束大小（像素），默认与起始大小相同
   */
  setParticleSize(startSize: number, endSize: number = startSize): void {
    this.pp.config.startParticleSize = startSize;
    this.pp.config.finishParticleSize = endSize;
    this._emitter.updateConfig(this.pp.config);
  }

  /**
   * 设置重力方向和强度
   * 仅在重力模式下生效，影响粒子的运动轨迹
   * @param x 水平方向的重力加速度
   * @param y 垂直方向的重力加速度
   */
  setGravity(x: number, y: number): void {
    this.pp.config.gravityX = x;
    this.pp.config.gravityY = y;
    this._emitter.updateConfig(this.pp.config);
    this._updater.updateConfig(this.pp.config);
  }

  /**
   * 设置粒子发射角度
   * 仅在重力模式下生效，控制粒子的初始发射方向
   * @param angle 发射角度（弧度）
   * @param variance 角度的随机变化范围（弧度），默认为0
   */
  setAngle(angle: number, variance = 0): void {
    this.pp.config.angle = angle;
    this.pp.config.angleVariance = variance;
    this._emitter.updateConfig(this.pp.config);
  }

  /**
   * 每帧更新逻辑
   * 处理粒子发射、位置更新、生命周期管理和渲染数据更新
   */
  protected onUpdate(): void {
    if (this.isPaused) return;

    const deltaTime = this.stage?.timer.delta ?? 0.016;

    // 更新发射器位置
    this._emitter.setPosition(this.worldMatrix.tx, this.worldMatrix.ty);

    // 发射新粒子
    this._emitter.update(deltaTime);

    // 更新所有粒子
    const activeParticles = this._emitter.getActiveParticles();
    const aliveCount = this._updater.updateParticles(activeParticles, deltaTime, {
      x: this.worldMatrix.tx,
      y: this.worldMatrix.ty,
    });

    // 更新渲染对象
    this.renderObject.updateParticles(activeParticles);

    // 标记节点为dirty，确保渲染系统重新收集数据
    this.markDirty(DirtyType.child);

    // 检查是否播放完成
    if (!this.isPlaying && aliveCount === 0) {
      this.emit('complete');
    }
  }

  /**
   * 计算粒子系统的本地边界
   * 基于配置参数估算粒子可能的活动范围
   * @param bounds 边界对象，用于设置计算结果
   */
  protected override _customLocalBounds(bounds: Bounds): void {
    // 基于配置估算粒子系统的边界
    const config = this.pp.config;
    const maxSize = Math.max(config.startParticleSize, config.finishParticleSize);
    const maxVarianceX = config.sourcePositionVarianceX;
    const maxVarianceY = config.sourcePositionVarianceY;

    // 简单估算：发射器位置 + 位置变化范围 + 最大粒子大小
    const halfSize = maxSize / 2;
    bounds.addFrame(
      -maxVarianceX - halfSize,
      -maxVarianceY - halfSize,
      maxVarianceX * 2 + maxSize,
      maxVarianceY * 2 + maxSize
    );
  }

  /**
   * 销毁粒子系统并清理所有资源
   * 会停止播放、重置状态并释放相关资源
   */
  override destroy(): void {
    this.stop();
    this.reset();
    super.destroy();
  }
}
