import { getUID } from "../../utils/utils";
import { Device } from "../device/device";
import type { ITextureBuffer } from "./interface";

/**
 * Texture 数据
 */
export class TextureBuffer implements ITextureBuffer {
  uid = getUID("TextureBuffer");
  readonly width: number = 0;
  readonly height: number = 0;
  readonly bitmap: ImageBitmap | HTMLCanvasElement;
  readonly texture: GPUTexture;
  readonly sampler: GPUSampler;
  readonly view: GPUTextureView;

  destroyed = false;
  loaded = false;

  constructor(bitmap: ImageBitmap | HTMLCanvasElement) {
    const { width, height } = bitmap;
    console.assert(width >= 0 && height >= 0);

    this.bitmap = bitmap;
    this.width = width;
    this.height = height;

    this.texture = Device.createTexture("texture", width, height);
    this.sampler = Device.defaultSampler;
    this.view = this.texture.createView();
  }

  /**
   * 销毁 Texture 数据
   */
  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      this.texture.destroy();
    }
  }

  /**
   * 上传数据到显卡
   */
  upload() {
    if (!this.loaded) {
      this.loaded = true;
      Device.uploadTexture(this.bitmap, this.texture);
      // TODO: 销毁内存数据，减少内存占用
      // if (this.bitmap instanceof ImageBitmap) this.bitmap.close();
    }
  }

  dirty() {
    this.uid = getUID("TextureBuffer");
    this.loaded = false;
  }
}
