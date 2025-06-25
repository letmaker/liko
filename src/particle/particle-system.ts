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

export interface IParticleSystemOptions extends INodeOptions {
  /**
   * 粒子配置文件URL（plist格式）
   * 支持cocos-engine导出的plist格式配置文件
   * 示例：'assets/effects/fire.plist'
   */
  url?: string;
  /**
   * 粒子纹理，如果不指定，系统会使用默认白色纹理
   * 可以通过 loader.load<Texture>() 预加载纹理
   */
  texture?: Texture;
  /**
   * 是否自动播放
   * true: 添加到舞台后自动开始播放
   * false: 需要手动调用 play() 方法
   * 注意：只有在已添加到舞台时才会自动播放
   */
  autoPlay?: boolean;
  /**
   * 粒子配置
   * 可以直接通过代码配置粒子参数，会与默认配置合并
   * 优先级：传入的config > url加载的配置 > 默认配置
   */
  config?: ParticleConfigOptions;
}

/**
 * 粒子系统组件
 *
 * 完整的2D粒子系统实现，兼容cocos-engine的plist格式配置文件。
 * 支持重力模式和径向模式两种发射器类型，提供丰富的粒子效果。
 * 1. 重力模式 (EmitterMode.GRAVITY) - 适用于火焰、烟雾、爆炸等效果
 * 2. 径向模式 (EmitterMode.RADIUS) - 适用于旋转、环绕等效果
 *
 * ## 快速开始：
 * ```typescript
 * import { ParticleSystem } from 'liko';
 *
 * // 1. 通过plist配置文件创建粒子系统（推荐方式）
 * const fireParticle = new ParticleSystem({
 *   url: 'assets/effects/fire.plist',
 *   position: { x: 400, y: 300 },
 *   parent:scene, // 必须添加到舞台才能播放
 *   autoPlay: true
 * });
 * ```
 *
 * ## 基础使用示例：
 * ```typescript
 * // 2. 通过配置对象创建粒子系统
 * const customParticle = new ParticleSystem({
 *   config: {
 *     emitterMode: EmitterMode.GRAVITY,
 *     maxParticles: 100,
 *     emissionRate: 50,
 *     particleLifespan: 2.0,
 *     startParticleSize: 32,
 *     finishParticleSize: 0,
 *     startColorRed: 1.0,
 *     startColorGreen: 0.5,
 *     startColorBlue: 0.0,
 *     startColorAlpha: 1.0
 *   },
 *   position: { x: 500, y: 500 }
 * });
 *
 * // 添加到场景并播放
 * stage.addChild(customParticle);
 * customParticle.play();
 * ```
 *
 * ## 控制粒子播放：
 * ```typescript
 * // 播放控制
 * particle.play();         // 开始播放（必须先添加到舞台）
 * particle.stop();         // 停止发射（现有粒子继续运行）
 * particle.pause();        // 暂停整个系统
 * particle.resume();       // 恢复播放
 * particle.reset();        // 重置系统（清除所有粒子）
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
 * // 修改粒子颜色（支持渐变）
 * particle.setStartColor({ r: 1, g: 0, b: 0, a: 1 }); // 红色
 * particle.setEndColor({ r: 1, g: 1, b: 0, a: 0 });   // 透明黄色
 *
 * // 修改粒子大小（支持缩放动画）
 * particle.setParticleSize(32, 0); // 从32像素缩放到0（消失效果）
 *
 * // 修改重力（仅重力模式有效）
 * particle.setGravity(0, 98); // 向下重力
 *
 * // 修改发射角度
 * particle.setAngle(Math.PI / 4, Math.PI / 8); // 45度角，±22.5度变化
 *
 * // 修改粒子生命周期
 * particle.setParticleLifespan(3.0, 0.5); // 3秒±0.5秒
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
 * particle.on(EventType.complete, () => {
 *   console.log('粒子播放结束');
 *   // 可以选择移除或重新播放
 *   particle.reset();
 *   particle.play();
 * });
 * ```
 *
 * ## 性能优化建议：
 * ```typescript
 * // 1. 合理设置最大粒子数
 * particle.config = {
 *   maxParticles: 50 // 根据设备性能调整，移动端建议≤100
 * };
 *
 * // 2. 及时清理不需要的粒子系统
 * particle.destroy(); // 销毁并释放资源
 *
 * // 3. 使用对象池（引擎自动管理）
 * const particles = [];
 * for (let i = 0; i < 10; i++) {
 *   const p = new ParticleSystem({ url: 'effect.plist' });
 *   particles.push(p);
 * }
 * ```
 *
 * ## ⚠️ 重要注意事项：
 * 1. **必须先添加到舞台**：调用 play() 之前必须先 stage.addChild(particle)
 * 2. **异步加载**：使用 url 时配置加载是异步的，监听 'loaded' 事件确认加载完成
 * 3. **纹理路径**：plist文件中的纹理路径是相对于plist文件的相对路径
 * 4. **内存管理**：及时调用 destroy() 释放不再使用的粒子系统
 * 5. **性能考虑**：maxParticles 过大可能影响性能，建议移动端≤100个
 * 6. **坐标系统**：粒子位置基于父容器的坐标系统
 * 7. **模式限制**：某些配置参数只在特定模式下生效（重力模式 vs 径向模式）
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
   * true: 正在发射新粒子并更新现有粒子
   * false: 已停止发射，但现有粒子可能仍在运行
   */
  isPlaying = false;

  /**
   * 粒子系统是否已暂停
   * @readonly 通过 pause() 和 resume() 方法控制此状态
   * true: 暂停更新粒子，但仍会渲染当前状态的粒子
   * false: 正常更新粒子状态
   */
  isPaused = false;

  /**
   * 是否在添加到舞台时自动播放
   * 只有在已添加到舞台（this.stage存在）时才会自动播放
   * 如果添加时尚未加载完成，会在加载完成后自动播放
   */
  autoPlay = false;

  /**
   * 创建粒子系统实例
   *
   * @param options 粒子系统配置选项
   *
   * ## 使用说明：
   * - 如果指定了 url，会异步加载plist配置文件
   * - 如果指定了 config，会与默认配置合并
   * - 如果同时指定 url 和 config，config 中的参数会覆盖 url 加载的配置
   * - autoPlay 为 true 时，添加到舞台后会自动开始播放
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
   * 获取当前粒子配置对象，包含所有粒子行为的配置参数
   */
  get config(): ParticleConfig {
    return this.pp.config;
  }

  /**
   * 设置粒子配置
   *
   * 动态更新粒子系统的配置参数，支持部分更新和运行时修改。
   * 新配置会与默认配置合并，并立即生效于后续发射的粒子。
   */
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
   *
   * 自动解析cocos-engine导出的plist配置文件，并尝试加载配置中指定的纹理。
   * 加载完成后会触发 'loaded' 事件，如果设置了 autoPlay 会自动开始播放。
   *
   * @throws 当文件不存在、格式错误或网络失败时抛出错误
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
   * 开始播放粒子系统，启动粒子发射器并开始更新粒子状态。
   */
  play(): void {
    if (!this.stage) {
      console.error('ParticleSystem: stage is undefined, cannot play');
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this._emitter.start();

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
   * 每帧更新逻辑（内部方法）
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
   *
   * 彻底清理粒子系统，包括停止播放、重置状态、释放内存等。
   * 这是一个不可逆操作，销毁后的粒子系统无法再次使用。
   */
  override destroy(): void {
    this.stop();
    this.reset();
    super.destroy();
  }
}
