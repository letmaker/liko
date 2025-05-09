import { Matrix } from '../../math/matrix';
import { Device } from '../device/device';
import type { IBuffer } from './interface';

/**
 * 摄像机数据
 */
export class CameraBuffer implements IBuffer {
  private _width = 1;
  private _height = 1;

  readonly group: GPUBindGroup;
  readonly buffer: GPUBuffer;

  data: Float32Array = new Float32Array(16);
  projectionMatrix = new Matrix();
  rootMatrix = new Matrix();

  loaded = false;
  destroyed = false;

  constructor() {
    const { group, buffer } = Device.createProjectionMatrixBuffer('uProjection', this.data);
    this.group = group;
    this.buffer = buffer;
  }

  /**
   * 销毁数据
   */
  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      this.buffer.destroy();
    }
  }

  resize(width: number, height: number) {
    if (width !== this._width || height !== this._height) {
      const projection = this._createMatrix(width, height);
      Device.uploadUniform(this.buffer, projection);
      Device.setViewport(width * devicePixelRatio, height * devicePixelRatio);
      this.loaded = true;
    }
  }

  private _createMatrix(width: number, height: number) {
    this._width = width;
    this._height = height;

    this.calProjection(this.projectionMatrix, 0, 0, width, height, false);
    this.projectionMatrix.append(this.rootMatrix);

    return this.toArray(this.projectionMatrix);
  }

  toArray(projection: Matrix) {
    const array = this.data;
    array[0] = projection.a;
    array[1] = projection.b;
    array[2] = 0;
    array[3] = 0;

    array[4] = projection.c;
    array[5] = projection.d;
    array[6] = 0;
    array[7] = 0;

    array[8] = 0;
    array[9] = 0;
    array[10] = -1;
    array[11] = 0;

    array[12] = projection.tx;
    array[13] = projection.ty;
    array[14] = 1;
    array[15] = 1;

    // console.log(array);
    return array;
  }

  calProjection(pm: Matrix, x: number, y: number, width: number, height: number, flipY: boolean): Matrix {
    const sign = flipY ? 1 : -1;

    pm.identity();
    pm.a = (1 / width) * 2;
    pm.d = sign * ((1 / height) * 2);
    pm.tx = -1 - x * pm.a;
    pm.ty = -sign - y * pm.d;

    return pm;
  }
}
