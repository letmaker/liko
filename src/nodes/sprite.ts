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
 * 提供图像显示、纹理管理和事件处理等功能
 *
 * 使用示例：
 * ```typescript
 * const sprite = new Sprite({ url: 'tile.png', width: 400, height: 300 });
 * ```
 */
@RegNode('Sprite')
export class Sprite extends LikoNode {
  declare pp: ISpritePrivateProps;
  /** 用于渲染精灵的渲染对象 */
  readonly renderObject: SpriteObject = new SpriteObject(this);

  constructor(options?: Texture | ISpriteOptions) {
    super();
    this.pp.url = '';
    this.pp.repeat = false;
    if (options instanceof Texture) {
      this.texture = options;
    } else {
      this.setProps(options as Record<string, unknown>);
    }
  }

  /** 精灵使用的纹理对象 */
  get texture(): Texture {
    return this.pp.texture;
  }
  set texture(value: Texture) {
    if (this.pp.texture !== value) {
      if (this.pp.repeat && !value.repeat) {
        this.pp.texture = new Texture().setBuffer(new TextureBuffer(value.buffer.bitmap, true));
      } else {
        this.pp.texture = value;
      }

      this.emit(EventType.resize);

      // TODO 针对 texture 切换，要专门优化，重新组织 batch
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

  /** 精灵加载的图片 URL */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  /**
   * 从指定 URL 加载图片纹理
   * @param url - 图片资源的 URL 地址
   */
  async load(url: string) {
    const pp = this.pp;
    if (pp.url !== url) {
      pp.url = url;

      const texture = await loader.load<Texture>(url);
      if (this.destroyed || !texture) return;
      this.texture = texture;

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
   * 在未设置宽高时，使用纹理尺寸作为本地边界
   * @param bounds - 边界对象
   */
  protected override _customLocalBounds(bounds: Bounds) {
    const texture = this.pp.texture;
    if (texture) {
      bounds.addFrame(0, 0, texture.width, texture.height);
    }
  }

  /** 平铺模式 */
  get repeat(): boolean {
    return this.pp.repeat;
  }
  set repeat(value: boolean) {
    if (this.pp.repeat !== value) {
      this.pp.repeat = value;

      const texture = this.pp.texture;
      if (texture) {
        this.texture = new Texture().setBuffer(new TextureBuffer(texture.buffer.bitmap, value));
      }
    }
  }
}
