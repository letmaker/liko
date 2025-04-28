import { DirtyType, EventType } from "../const";
import { loader } from "../loader";
import type { Bounds } from "../math/bounds";
import { SpriteObject } from "../render/render/sprite-object";
import type { Texture } from "../resource/texture";
import { RegNode } from "../utils/decorators";
import type { INodeOptions } from "./node";
import { type INodePrivateProps, LikoNode } from "./node";
import type { IAnimation } from "./scene";
import type { IRenderable } from "./sprite";

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
 * 精灵动画类
 */
@RegNode("AnimatedSprite")
export class AnimatedSprite extends LikoNode implements IRenderable, IAnimation {
  declare pp: IAnimatedSpritePrivateProps;
  renderObject: SpriteObject = new SpriteObject(this);

  /** 标识动画是否正在播放 */
  isPlaying = false;
  /** 动画的播放帧率 */
  frameRate = 30;

  /** 精灵动画的纹理集合 */
  get textures(): Texture[] {
    return this.pp.textures;
  }
  set textures(value: Texture[]) {
    if (this.pp.textures === value) return;

    this.pp.textures = value;
    this._$renderFrame(0);
    this.markDirty(DirtyType.child);
  }

  /** 当前显示的纹理对象 */
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

  /** 动画的总持续时间（秒） */
  get duration(): number {
    return this.pp.textures.length / this.frameRate;
  }

  /** 当前显示的动画帧索引 */
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

  /** 动画资源的 URL 地址 */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  constructor(options?: IAnimatedSpriteOptions) {
    super();

    this.pp.url = "";
    this.pp.currentFrame = 0;
    this.pp.textures = [];

    this.setProps(options as Record<string, unknown>);
    this._$renderFrame(this.pp.currentFrame);
  }

  /**
   * 从指定 URL 加载动画资源
   * @param url - 动画资源的 URL 地址
   */
  async load(url: string) {
    if (this.pp.url !== url) {
      this.pp.url = url;

      const textures = await loader.load<Texture[]>(url, "sheet");
      if (this.destroyed || !textures) return;
      console.assert(textures.length > 0);

      this.textures = textures;
      this._$renderFrame(this.pp.currentFrame);
    }
    this.emit(EventType.loaded);
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
   * 如果动画已经在播放中，则不会重复开始
   */
  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      console.assert(this.stage !== undefined, "please add to stage first before play");

      this.stage?.timer.setInterval(1 / this.frameRate, this._$update, this);
      this.emit(EventType.played);
    }
  }

  /**
   * 停止播放动画
   * 如果动画已经停止，则不会执行任何操作
   */
  stop() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stage?.timer.clearTimer(this._$update, this);
      this.emit(EventType.stopped);
    }
  }

  private _$update() {
    this.currentFrame++;
  }

  /**
   * 跳转到动画的指定时间点
   * @param time - 目标时间点（秒）
   */
  gotoTime(time: number) {
    this.currentFrame = Math.round((time / this.duration) * this.pp.textures.length);
  }

  /**
   * 销毁精灵动画实例
   * 在销毁前会停止动画播放
   */
  override destroy(): void {
    this.stop();
    this.textures.length = 0;
    super.destroy();
  }
}
