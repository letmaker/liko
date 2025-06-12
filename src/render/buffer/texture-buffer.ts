import { getUID } from '../../utils/utils';
import { Device } from '../device/device';
import type { ITextureBuffer } from './interface';

/**
 * 纹理缓冲区类，用于管理 GPU 纹理资源
 *
 * 该类封装了纹理的创建、上传、销毁等操作，提供了纹理资源的完整生命周期管理。
 * 支持从 ImageBitmap 或 HTMLCanvasElement 创建纹理，并可配置纹理的重复模式。
 */
export class TextureBuffer implements ITextureBuffer {
  /** 唯一标识符，用于追踪纹理实例 */
  uid = getUID('TextureBuffer');

  /** 纹理宽度（像素），只读属性 */
  readonly width: number = 0;

  /** 纹理高度（像素），只读属性 */
  readonly height: number = 0;

  /** 源位图数据，可以是 ImageBitmap 或 HTMLCanvasElement，只读属性 */
  readonly bitmap: ImageBitmap | HTMLCanvasElement;

  /** WebGPU 纹理对象，只读属性 */
  readonly texture: GPUTexture;

  /** WebGPU 采样器，根据 repeat 参数选择默认采样器或重复采样器，只读属性 */
  readonly sampler: GPUSampler;

  /** WebGPU 纹理视图，用于在着色器中访问纹理，只读属性 */
  readonly view: GPUTextureView;

  /** 标记纹理是否已被销毁 */
  destroyed = false;

  /** 标记纹理数据是否已上传到 GPU */
  loaded = false;

  /** 标记纹理是否启用重复模式 */
  repeat = false;

  /**
   * 创建纹理缓冲区实例
   *
   * @param bitmap 源位图数据，支持 ImageBitmap 或 HTMLCanvasElement
   * @param repeat 是否启用纹理重复模式，默认为 false
   *
   * @remarks
   * - bitmap 的宽度和高度必须大于等于 0
   * - 创建时会立即分配 GPU 纹理资源，但不会上传数据
   * - 需要手动调用 upload() 方法将数据上传到 GPU
   */
  constructor(bitmap: ImageBitmap | HTMLCanvasElement, repeat = false) {
    const { width, height } = bitmap;
    console.assert(width >= 0 && height >= 0);

    this.bitmap = bitmap;
    this.width = width;
    this.height = height;

    this.texture = Device.createTexture('texture', width, height);
    this.repeat = repeat;
    this.sampler = repeat ? Device.defaultRepeatSampler : Device.defaultSampler;
    this.view = this.texture.createView();
  }

  /**
   * 销毁纹理资源
   *
   * @remarks
   * - 释放 GPU 纹理内存
   * - 销毁后不能再使用该纹理实例
   * - 重复调用是安全的，不会产生副作用
   */
  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      this.texture.destroy();
    }
  }

  /**
   * 将位图数据上传到 GPU
   *
   * @remarks
   * - 只有在首次调用或调用 dirty() 后才会实际上传数据
   * - 上传完成后会将 loaded 标记为 true
   * - 重复调用是安全的，不会重复上传相同数据
   */
  upload() {
    if (!this.loaded) {
      this.loaded = true;
      Device.uploadTexture(this.bitmap, this.texture);
      // TODO: 销毁内存数据，减少内存占用
      // if (this.bitmap instanceof ImageBitmap) this.bitmap.close();
    }
  }

  /**
   * 标记纹理数据为脏状态
   *
   * @remarks
   * - 重新生成唯一标识符
   * - 将 loaded 状态重置为 false
   * - 下次调用 upload() 时会重新上传数据到 GPU
   * - 当源位图数据发生变化时应调用此方法
   */
  dirty() {
    this.uid = getUID('TextureBuffer');
    this.loaded = false;
  }
}
