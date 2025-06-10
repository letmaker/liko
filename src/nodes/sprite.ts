import { DirtyType, EventType } from '../const';
import { loader } from '../loader';
import type { Bounds } from '../math/bounds';
import { TextureBuffer } from '../render/buffer/texture-buffer';
import type { IRenderObject } from '../render/render/render-object';
import { SpriteObject } from '../render/render/sprite-object';
import { Texture } from '../resource/texture';
import type { ColorData } from '../utils/color';
import { RegNode } from '../utils/decorators';
import type { INodeOptions } from './node';
import { type INodePrivateProps, LikoNode } from './node';

/** 实现 IRenderable 接口的节点可以渲染图像 */
export interface IRenderable extends LikoNode {
  renderObject: IRenderObject;
  texture: Texture;
}

interface ISpritePrivateProps extends INodePrivateProps {
  url: string;
  texture: Texture;
  repeat: boolean;
}

interface ISpriteOptions extends INodeOptions {
  /** 精灵加载的图片 URL */
  url?: string;
  /** 精灵使用的纹理对象 */
  texture?: Texture;
  /** 精灵叠加颜色，用于调整节点的颜色 */
  tintColor?: ColorData;
  /** 精灵加载完成后的回调函数 */
  onLoaded?: () => void;
  /** 平铺模式 */
  repeat?: boolean;
}

/**
 * 精灵类，使用图片作为渲染对象
 *
 * Sprite 是游戏引擎中最常用的可视化节点，用于显示图片、纹理和精灵动画。
 * 它提供了图像显示、纹理管理、平铺模式和事件处理等功能。
 *
 * ## 基础用法示例：
 * ```typescript
 * // 1. 通过 URL 创建精灵
 * const sprite = new Sprite({
 *   url: 'assets/player.png',
 *   position: { x: 100, y: 100 },
 *   width: 64,
 *   height: 64,
 * });
 *
 * // 2. 通过现有纹理创建精灵
 * const texture = await loader.load<Texture>('assets/background.png');
 * const sprite = new Sprite({texture});
 *
 * // 3. 创建平铺精灵（用于背景或图案）
 * const tileSprite = new Sprite({
 *   url: 'assets/tile.png',
 *   width: 400,
 *   height: 300,
 *   repeat: true  // 启用平铺模式
 * });
 * ```
 *
 * ## 高级用法示例：
 * ```typescript
 * // 动态加载和切换纹理
 * const sprite = new Sprite();
 * await sprite.load('assets/idle.png');
 *
 * // 切换到攻击动画
 * await sprite.load('assets/attack.png');
 *
 * // 设置颜色叠加（染色效果）
 * const coloredSprite = new Sprite({
 *   url: 'assets/enemy.png',
 *   tintColor: '#ff0000', // 红色调
 *   onLoaded: () => console.log('敌人精灵加载完成')
 * });
 *
 * // 监听加载完成事件
 * sprite.on(EventType.loaded, () => {
 *   console.log('精灵纹理加载完成，可以开始渲染');
 * });
 * ```
 *
 * ## 重要注意事项：
 *
 * ### 纹理管理：
 * - 纹理对象会被自动缓存，相同 URL 的图片不会重复加载
 * - 设置新纹理时会自动触发重新渲染
 * - 销毁精灵时不会自动销毁纹理（纹理可能被其他精灵共享）
 *
 * ### 尺寸行为：
 * - 如果未设置 width/height（默认 -1），会自动使用纹理的原始尺寸
 * - 设置明确尺寸后，图片会缩放以适应指定尺寸
 * - 平铺模式下，纹理会在指定尺寸区域内重复显示
 *
 * ### 平铺模式限制：
 * - 启用平铺模式时，纹理会被自动转换为支持平铺的格式
 * - 平铺模式要求纹理尺寸为 2 的幂次（如 64x64, 128x256）
 * - 非幂次纹理在平铺模式下可能产生接缝或显示异常
 *
 * ### 性能考虑：
 * - 相同纹理的精灵会被自动批处理以提高渲染性能
 * - 频繁切换纹理会影响批处理效率，建议预加载常用纹理
 * - 大量精灵使用相同纹理时，考虑使用精灵表（Sprite Atlas）
 *
 * ### 加载处理：
 * - load() 方法是异步的，加载失败时会抛出错误
 * - 可以通过 EventType.loaded 事件监听加载完成
 * - 加载过程中精灵可能显示为空白，直到纹理加载完成
 *
 * ### 内存管理：
 * - 精灵销毁时会自动从渲染批次中移除
 * - 大型纹理会占用较多显存，注意及时释放不用的纹理
 * - 避免创建过多大尺寸的平铺精灵
 *
 * ## 性能优化建议：
 * - 相同的纹理会被自动批处理以提高渲染性能
 * - 预加载常用纹理可以避免运行时的加载延迟
 * - 合理规划纹理尺寸，避免过大的纹理影响性能
 */
@RegNode('Sprite')
export class Sprite extends LikoNode {
  declare pp: ISpritePrivateProps;

  /** 用于渲染精灵的渲染对象, 通常不需要直接操作这个对象，渲染引擎会自动管理其生命周期 */
  readonly renderObject: SpriteObject = new SpriteObject(this);

  /**
   * 创建一个新的精灵实例
   */
  constructor(options?: ISpriteOptions) {
    super();
    this.pp.url = '';
    this.pp.repeat = false;
    this.setProps(options as Record<string, unknown>);
  }

  /**
   * 精灵使用的纹理对象
   *
   * 设置新纹理时会自动触发重新渲染和尺寸调整。
   * 如果启用了平铺模式但纹理不支持平铺，会自动转换纹理格式。
   */
  get texture(): Texture {
    return this.pp.texture;
  }
  set texture(value: Texture) {
    if (this.pp.texture !== value) {
      // 如果启用了平铺模式但纹理不支持平铺，自动转换
      if (this.pp.repeat && !value.repeat) {
        this.pp.texture = new Texture().setBuffer(new TextureBuffer(value.buffer.bitmap, true));
      } else {
        this.pp.texture = value;
      }

      this.emit(EventType.resize);

      // 优化批处理：尝试复用现有纹理 ID 或添加新纹理到批处理中
      const batch = this.renderObject.batch;
      const textureId = batch?.getTextureId(value) ?? batch?.add(this.texture);
      if (textureId !== undefined && textureId > -1) {
        this.renderObject.textureId = textureId;
        this.markDirty(DirtyType.texture);
      } else {
        this.markDirty(DirtyType.child);
      }
    }
  }

  /**
   * 精灵加载的图片 URL
   *
   * 设置此属性会自动触发图片加载过程。
   * 支持相对路径和绝对路径，以及各种图片格式（PNG、JPG、WebP 等）。
   * 相同 URL 的图片会被自动缓存，不会重复加载。
   */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  /**
   * 从指定 URL 异步加载图片纹理
   *
   * 此方法会通过资源加载器加载图片，创建纹理对象，并自动设置精灵的尺寸。
   * 如果精灵的宽高未设置（为 -1），会自动使用纹理的原始尺寸。
   * 加载完成后会触发 EventType.loaded 事件。
   *
   * @param url - 图片资源的 URL 地址，支持相对路径和绝对路径
   * @returns Promise，在加载完成时解析，加载失败时拒绝
   */
  async load(url: string) {
    const pp = this.pp;
    if (pp.url !== url) {
      pp.url = url;

      const texture = await loader.load<Texture>(url);
      if (this.destroyed || !texture) return;
      this.texture = texture;

      // 如果未设置尺寸，使用纹理的原始尺寸
      if (pp.width === -1) {
        this.width = texture.width;
      }
      if (pp.height === -1) {
        this.height = texture.height;
      }
      this.markDirty(DirtyType.size);
    }
    this.emit(EventType.loaded);
  }

  /**
   * 自定义本地边界计算
   *
   * 当精灵没有设置明确的宽高时，使用纹理的尺寸来计算边界。
   * 这确保了精灵有正确的碰撞检测和渲染区域。
   */
  protected override _customLocalBounds(bounds: Bounds) {
    const texture = this.pp.texture;
    if (texture) {
      bounds.addFrame(0, 0, texture.width, texture.height);
    }
  }

  /**
   * 平铺模式开关
   *
   * 启用平铺模式后，纹理会在精灵的区域内重复显示，常用于背景、地板等场景。
   * 设置为 true 时，纹理会自动转换为支持平铺的格式。
   * 注意：平铺模式要求纹理尺寸最好为 2 的幂次，以避免显示异常。
   */
  get repeat(): boolean {
    return this.pp.repeat;
  }
  set repeat(value: boolean) {
    if (this.pp.repeat !== value) {
      this.pp.repeat = value;

      const texture = this.pp.texture;
      if (texture) {
        // 重新创建纹理以支持或禁用平铺模式
        this.texture = new Texture().setBuffer(new TextureBuffer(texture.buffer.bitmap, value));
      }
    }
  }
}
