import { Sprite } from "../../nodes/sprite";
import { Texture } from "../../resource/texture";
import { RenderTargetBuffer } from "../buffer/render-target-buffer";

/**
 * 渲染材质
 */
export class RenderTarget extends Sprite {
  buffer!: RenderTargetBuffer;

  constructor() {
    super();
    this.texture = new Texture();
  }

  override destroy(): this {
    this.buffer?.destroy();
    return this;
  }

  createTexture(width: number, height: number) {
    if (!this.buffer || this.width !== width || this.height !== height) {
      // 销毁之前的 buffer
      this.buffer?.destroy();

      this.width = width;
      this.height = height;
      this.buffer = new RenderTargetBuffer(width, height);
      this.texture.setBuffer(this.buffer);
    }
    return this.buffer.texture;
  }
}
