import { DirtyType, EventType } from '../const';
import { loader } from '../loader';
import type { Bounds } from '../math/bounds';
import { SpriteObject } from '../render/render/sprite-object';
import type { Texture } from '../resource/texture';
import { RegNode } from '../utils/decorators';
import type { INodeOptions } from './node';
import { type INodePrivateProps, LikoNode } from './node';
import type { IAnimation } from './scene';
import type { IRenderable } from './sprite';

interface IAnimatedSpritePrivateProps extends INodePrivateProps {
  url: string;
  currentFrame: number;
  texture: Texture;
  textures: Texture[];
}

interface IAnimatedSpriteOptions extends INodeOptions {
  /** 动画资源的 URL 地址 */
  url?: string;
  /** 动画的播放帧率 */
  frameRate?: number;
  /** 精灵动画的纹理集合 */
  textures?: Texture[];
  /** 动画开始播放事件回调 */
  onPlayed?: () => void;
  /** 动画停止播放事件回调 */
  onStopped?: () => void;
  /** 动画加载完成事件回调 */
  onLoaded?: () => void;
  /** 动画播放结束事件回调 */
  onEnded?: () => void;
}

/**
 * 精灵动画类，用于播放序列帧动画
 *
 * 该类支持两种方式创建动画：
 * 1. 通过 URL 加载动画资源（推荐）
 * 2. 直接设置纹理集合
 *
 * 主要功能：
 * - 自动循环播放序列帧动画
 * - 支持自定义帧率控制
 * - 提供播放、停止、跳转等控制方法
 * - 支持动画事件监听（播放、停止、加载完成、播放结束）
 *
 * 使用示例：
 * ```typescript
 * // 方式一：通过 URL 加载
 * const sprite = new AnimatedSprite({
 *   url: 'assets/character.atlas',
 *   frameRate: 10,
 *   onLoaded: () => console.log('动画加载完成'),
 *   onPlayed: () => console.log('动画开始播放'),
 *   onEnded: () => console.log('动画播放结束一轮')
 * });
 *
 * // 方式二：直接设置纹理
 * const sprite = new AnimatedSprite({
 *   textures: [texture1, texture2, texture3],
 *   frameRate: 10
 * });
 *
 * // 添加到舞台并播放
 * stage.addChild(sprite);
 * sprite.play();
 *
 * // 控制动画
 * sprite.stop();                    // 停止播放
 * sprite.gotoTime(1.5);            // 跳转到 1.5 秒位置
 * sprite.currentFrame = 10;        // 跳转到第 10 帧
 * ```
 *
 * 注意事项：
 * - 必须先将精灵添加到舞台（stage）才能调用 play() 方法
 * - 动画会自动循环播放，播放到最后一帧时会触发 ended 事件并重新开始
 * - 所有控制方法都支持链式调用
 * - 销毁时会自动停止播放并清理资源
 */
@RegNode('AnimatedSprite')
export class AnimatedSprite extends LikoNode implements IRenderable, IAnimation {
  declare pp: IAnimatedSpritePrivateProps;
  readonly renderObject: SpriteObject = new SpriteObject(this);

  /** 标识动画是否正在播放 */
  isPlaying = false;
  /** 动画的播放帧率，默认为 20 帧/秒。修改此值会影响动画播放速度 */
  frameRate = 20;

  /**
   * 精灵动画的纹理集合
   * 设置新的纹理集合时会自动重置当前帧到第一帧并重新计算锚点
   */
  get textures(): Texture[] {
    return this.pp.textures;
  }
  set textures(value: Texture[]) {
    if (this.pp.textures === value) return;

    this.pp.textures = value;
    this.pp.currentFrame = -1;
    this.currentFrame = 0;
    this.markDirty(DirtyType.child);

    // 重新设置一下anchor
    this.anchor = this.anchor;
  }

  /**
   * 当前显示的纹理对象
   * 这是当前帧对应的纹理，通常不需要手动设置
   */
  get texture(): Texture {
    return this.pp.texture;
  }
  set texture(value: Texture) {
    if (this.pp.texture !== value) {
      this.pp.texture = value;
      this.markDirty(DirtyType.texture);
      this.markDirty(DirtyType.size);
    }
  }

  /**
   * 动画的总持续时间（秒）
   * 计算公式：总帧数 / 帧率
   */
  get duration(): number {
    return this.pp.textures.length / this.frameRate;
  }

  /**
   * 当前显示的动画帧索引（从 0 开始）
   * 设置超出范围的值会自动重置为 0，并触发循环播放
   */
  get currentFrame() {
    return this.pp.currentFrame;
  }
  set currentFrame(value: number) {
    if (this.pp.currentFrame !== value) {
      this.pp.currentFrame = value;
      this._$renderFrame(value);
    }
  }

  private _$renderFrame(frame: number) {
    const { textures } = this.pp;
    if (textures.length) {
      let index = frame;
      if (index >= textures.length) {
        index = 0;
        this.pp.currentFrame = 0;
      }
      this.texture = textures[index];
      if (index === textures.length - 1) {
        this.emit(EventType.ended);
      }
    }
  }

  /**
   * 动画资源的 URL 地址
   * 设置新的 URL 会自动加载对应的动画资源
   */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    if (this.pp.url !== value) {
      this.load(value);
    }
  }

  constructor(options?: IAnimatedSpriteOptions) {
    super();

    this.pp.url = '';
    this.pp.currentFrame = 0;
    this.pp.textures = [];

    this.setProps(options as Record<string, unknown>);
    this._$renderFrame(this.pp.currentFrame);
  }

  /**
   * 从指定 URL 加载动画资源
   * 加载完成后会触发 loaded 事件
   * @param url - 动画资源的 URL 地址，通常是 JSON 格式的精灵表配置文件
   */
  async load(url: string) {
    if (this.pp.url !== url) {
      this.pp.url = url;

      const textures = await loader.load<Texture[]>(url, 'sheet');
      // 检查是否仍然需要这个 URL 的结果（防止竞态条件）
      if (this.destroyed || !textures || this.pp.url !== url) return;
      console.assert(textures.length > 0);

      this.textures = textures;
      this.emit(EventType.loaded);
    }
  }

  /**
   * 自定义本地边界计算
   * 使用当前纹理的尺寸作为边界
   * @param bounds - 边界对象
   */
  protected override _customLocalBounds(bounds: Bounds) {
    const { texture } = this.pp;
    if (texture) {
      bounds.addFrame(0, 0, texture.width, texture.height);
    }
  }

  /**
   * 开始播放动画
   * 注意：必须先将精灵添加到舞台（stage）才能调用此方法
   * 如果动画已经在播放中，则不会重复开始
   * 播放开始时会触发 played 事件
   * @returns 当前实例，支持链式调用
   */
  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      console.assert(this.stage !== undefined, 'please add to stage first before play');

      this.stage?.timer.setInterval(1 / this.frameRate, this._$update, this);
      this.emit(EventType.played);
    }
    return this;
  }

  /**
   * 停止播放动画
   * 如果动画已经停止，则不会执行任何操作
   * 停止时会触发 stopped 事件，但不会重置当前帧位置
   * @returns 当前实例，支持链式调用
   */
  stop() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stage?.timer.clearTimer(this._$update, this);
      this.emit(EventType.stopped);
    }
    return this;
  }

  private _$update() {
    this.currentFrame++;
  }

  /**
   * 跳转到动画的指定时间点
   * 会根据时间计算对应的帧索引并跳转到该帧
   * @param time - 目标时间点（秒），如果超出动画总时长会按比例计算对应帧
   * @returns 当前实例，支持链式调用
   */
  gotoTime(time: number) {
    this.currentFrame = Math.round((time / this.duration) * this.pp.textures.length);
    return this;
  }

  /**
   * 销毁精灵动画实例
   * 在销毁前会自动停止动画播放并清空纹理集合，释放所有相关资源
   */
  override destroy(): void {
    this.stop();
    this.textures.length = 0;
    super.destroy();
  }
}
