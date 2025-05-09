import { Device } from '../device/device';
import { fastCopy } from '../utils/utils';
import type { IBuffer } from './interface';

export class IndexBuffer implements IBuffer {
  private _array: ArrayBuffer;
  private _buffer?: GPUBuffer;

  destroyed = false;
  loaded = false;
  // TODO 更换为 16？
  data: Uint32Array;
  size = 0;

  constructor(size = 4) {
    this.size = size;
    this._array = new ArrayBuffer(size * 4);
    this.data = new Uint32Array(this._array);
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this._buffer?.destroy();
    }
  }

  fat(size: number) {
    let newSize = Math.max(size, this.size * 1.5);
    newSize += newSize % 2;
    this.size = newSize;

    const newBuffer = fastCopy(this._array, new ArrayBuffer(newSize * 4));
    this.data = new Uint32Array(newBuffer);

    this._buffer?.destroy();
    this._buffer = undefined;
  }

  get buffer() {
    if (!this._buffer) {
      this._buffer = Device.createIndexBuffer('index', this.data);
    }
    return this._buffer;
  }

  upload() {
    if (!this.loaded) {
      this.loaded = true;
      Device.uploadBuffer(this.buffer, this.data, true);
    }
  }

  reset() {
    this.loaded = false;
  }
}
