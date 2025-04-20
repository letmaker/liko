import { DirtyType, EventType } from "../const";
import { loader } from "../loader";
import type { Bounds } from "../math/bounds";
import { SpriteObject } from "../render/render/sprite-object";
import { Texture } from "../resource/texture";
import type { ColorData } from "../utils/color";
import { RegNode } from "../utils/decorators";
import type { INodeOptions } from "./node";
import { type INodePrivateProps, LikoNode } from "./node";

/** 实现 IRenderable 接口，就可以渲染出图片 */
export interface IRenderable extends LikoNode {
  renderObject: SpriteObject;
  texture: Texture;
}

interface ISpritePrivateProps extends INodePrivateProps {
  url: string;
  texture: Texture;
}

interface ISpriteOptions extends INodeOptions {
  url?: string;
  texture?: Texture;
  tint?: ColorData;
}

/**
 * 精灵类，以图片为渲染对象
 */
@RegNode("Sprite")
export class Sprite extends LikoNode implements IRenderable {
  declare pp: ISpritePrivateProps;
  /** 渲染对象 */
  renderObject: SpriteObject = new SpriteObject(this);

  constructor(options?: Texture | ISpriteOptions) {
    super();
    this.pp.url = "";
    if (options instanceof Texture) {
      this.texture = options;
    } else {
      this.setProps(options as Record<string, any>);
    }
  }

  /** 渲染纹理 */
  get texture(): Texture {
    return this.pp.texture;
  }
  set texture(value: Texture) {
    if (this.pp.texture !== value) {
      this.pp.texture = value;
      this.emit(EventType.resize);

      // TODO 针对 texture 切换，要专门优化，重新组织 batch
      const batch = this.renderObject.batch;
      const textureId = batch?.getTextureId(value) ?? batch?.add(this.texture);
      if (textureId && textureId > -1) {
        this.renderObject.textureId = textureId;
        this.onDirty(DirtyType.texture);
      } else {
        this.onDirty(DirtyType.child);
      }
    }
  }

  /** 精灵的图片地址 */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  /** 加载图片 */
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
      this.onDirty(DirtyType.size);
    }
    this.emit(EventType.loaded);
  }

  /** 在不设置宽高的情况下，优先使用 texture 作为 localBounds 边界 */
  protected override _customLocalBounds(bounds: Bounds) {
    const texture = this.pp.texture;
    if (texture) {
      bounds.addFrame(0, 0, texture.width, texture.height);
    }
  }
}
