import { getUID } from '../../utils/utils';
import { Device } from '../device/device';
import type { ITextureBuffer } from './interface';

/**
 * RenderTarget 数据
 */
export class RenderTargetBuffer implements ITextureBuffer {
  readonly uid = getUID('RenderTargetBuffer');
  readonly loaded: boolean = true;
  readonly width: number = 0;
  readonly height: number = 0;
  readonly texture: GPUTexture;
  readonly sampler: GPUSampler;
  readonly view: GPUTextureView;

  destroyed = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.texture = Device.createTexture('renderTarget', width, height);
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

  upload(): void {
    // 无需上传
  }

  dirty() {
    // 无需上传
  }
}
