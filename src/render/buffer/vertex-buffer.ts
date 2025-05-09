import { Device } from '../device/device';
import { fastCopy } from '../utils/utils';
import type { IBuffer } from './interface';

export class VertexBuffer implements IBuffer {
  private _array: ArrayBuffer;
  private _buffer?: GPUBuffer;

  f32Data: Float32Array;
  u32Data: Uint32Array;
  size = 0;

  destroyed = false;
  loaded = false;

  constructor(public label = 'vertex') {
    this.size = 1;
    this._array = new ArrayBuffer(this.size * 4);
    this.f32Data = new Float32Array(this._array);
    this.u32Data = new Uint32Array(this._array);
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this._buffer?.destroy();
    }
  }

  fat(size: number) {
    this.size = size;
    const newBuffer = fastCopy(this._array, new ArrayBuffer(size * 4));
    this.f32Data = new Float32Array(newBuffer);
    this.u32Data = new Uint32Array(newBuffer);

    this._buffer?.destroy();
    this._buffer = undefined;
  }

  get buffer() {
    if (!this._buffer) {
      this._buffer = Device.createVertexBuffer(this.label, this.f32Data);
    }
    return this._buffer;
  }

  upload() {
    if (!this.loaded) {
      this.loaded = true;
      Device.uploadBuffer(this.buffer, this.f32Data);
    }
  }

  reset() {
    this.loaded = false;
  }
}
