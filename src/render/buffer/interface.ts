/**
 * GPU buffer 数据接口
 */
export interface IBuffer {
  destroyed: boolean;
  loaded: boolean;
  destroy: () => void;
}

/**
 * GPU buffer 数据接口
 */
export interface ITextureBuffer extends IBuffer {
  uid: string;
  bitmap: ImageBitmap | HTMLCanvasElement;
  texture: GPUTexture;
  view: GPUTextureView;
  sampler: GPUSampler;
  width: number;
  height: number;
  repeat: boolean;
  upload: () => void;
  dirty: () => void;
}
