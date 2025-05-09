import { Device } from '../device/device';
import type { IBuffer } from './interface';

export class Buffer implements IBuffer {
  private _array: ArrayBuffer;
  private _buffer?: GPUBuffer;

  f32Data: Float32Array;
  u32Data: Uint32Array;
  size = 0;
  index = 0;

  destroyed = false;
  loaded = false;

  constructor(size = 1) {
    this.size = size;
    this._array = new ArrayBuffer(size * 4);
    this.f32Data = new Float32Array(this._array);
    this.u32Data = new Uint32Array(this._array);
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this._buffer?.destroy();
    }
  }

  get buffer() {
    if (!this._buffer) {
      this._buffer = Device.createUniformBuffer('vertex', this.u32Data);
    }
    return this._buffer;
  }

  upload() {
    if (!this.loaded) {
      this.loaded = true;
      Device.uploadBuffer(this.buffer, this.u32Data);
    }
  }

  addFloat32(value: number) {
    this.f32Data[this.index] = value;
    this.index++;
  }

  reset() {
    this.index = 0;
    this.loaded = false;
  }
}
