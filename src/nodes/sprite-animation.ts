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

interface ISpriteAnimationPrivateProps extends INodePrivateProps {
  url: string;
  frame: number;
  texture: Texture;
}

interface ISpriteAnimationOptions extends INodeOptions {
  url?: string;
  frameRate?: number;
  textures?: Texture[];
}

/**
 * 精灵动画
 */
@RegNode("SpriteAnimation")
export class SpriteAnimation extends LikoNode implements IRenderable, IAnimation {
  declare pp: ISpriteAnimationPrivateProps;
  renderObject: SpriteObject = new SpriteObject(this);

  /** 精灵动画纹理集合 */
  textures: Texture[] = [];
  /** 是否在播放 */
  playing = false;
  /** 动画帧率 */
  frameRate = 30;

  constructor(options?: ISpriteAnimationOptions) {
    super();

    this.pp.url = "";
    this.pp.frame = 0;

    this.setProps(options as Record<string, unknown>);
    this._$renderFrame(this.pp.frame);
  }

  override destroy(): void {
    this.stop();
    super.destroy();
  }

  /** 当前纹理 */
  get texture(): Texture {
    return this.pp.texture;
  }
  set texture(value: Texture) {
    if (this.pp.texture !== value) {
      this.pp.texture = value;
      this.onDirty(DirtyType.texture);
    }
  }

  /** 动画持续时长 */
  get duration(): number {
    return this.textures.length / this.frameRate;
  }

  /** 当前帧 */
  get frame() {
    return this.pp.frame;
  }
  set frame(value) {
    if (this.pp.frame !== value) {
      this.pp.frame = value;
      this._$renderFrame(value);
    }
  }

  private _$renderFrame(frame: number) {
    if (this.textures.length) {
      let index = frame;
      if (index >= this.textures.length) {
        index = 0;
        this.pp.frame = 0;
      }
      this.texture = this.textures[index];
      if (index === this.textures.length - 1) {
        this.emit(EventType.ended);
      }
    }
  }

  /** 动画地址 */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  /**
   * 加载动画
   */
  async load(url: string) {
    if (this.pp.url !== url) {
      this.pp.url = url;

      const textures = await loader.load<Texture[]>(url);
      if (this.destroyed || !textures) return;
      console.assert(textures.length > 0);

      this.textures = textures;
      this._$renderFrame(this.pp.frame);
    }
    this.emit(EventType.loaded);
  }

  protected override _customLocalBounds(bounds: Bounds) {
    const { texture } = this.pp;
    if (texture) {
      bounds.addFrame(0, 0, texture.width, texture.height);
    }
  }

  /**
   * 播放动画
   */
  play() {
    if (!this.playing) {
      this.playing = true;
      console.assert(this.stage !== undefined, "please add to stage first before play");

      this.stage?.timer.setInterval(1 / this.frameRate, this._$update, this);
      this.emit(EventType.played);
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.playing) {
      this.playing = false;
      this.stage?.timer.clearTimer(this._$update, this);
      this.emit(EventType.stopped);
    }
  }

  private _$update() {
    this.frame++;
  }

  /**
   * 播放到某个时间点
   */
  goto(time: number) {
    this.frame = Math.round((time / this.duration) * this.textures.length);
  }
}
