import { Buffer } from '../buffer/buffer';

type UNIFORM_TYPES_SINGLE =
  | 'f32'
  | 'vec2<f32>'
  | 'vec3<f32>'
  | 'vec4<f32>'
  | 'mat2x2<f32>'
  | 'mat3x3<f32>'
  | 'mat4x4<f32>'
  | 'u32';
type OPTIONAL_SPACE = ' ' | '';
type UNIFORM_TYPES_ARRAY = `array<${UNIFORM_TYPES_SINGLE},${OPTIONAL_SPACE}${number}>`;
export type UNIFORM_TYPES = UNIFORM_TYPES_SINGLE | UNIFORM_TYPES_ARRAY;
export declare const WGSL_TO_STD40_SIZE: Record<string, number>;

export interface IUniformData {
  value: any;
  type: UNIFORM_TYPES;
  size?: number;
  name?: string;
}

export class UniformGroup {
  private _options: Record<string, IUniformData>;
  buffer: Buffer;

  constructor(options: Record<string, IUniformData>) {
    this._options = options;
    this.buffer = this._createBuffer(options);
    this._fillData();
  }

  private _createBuffer(options: Record<string, IUniformData>) {
    const keys = Object.keys(options);
    let size = 0;
    for (const key of keys) {
      const data = options[key];
      if (!data.size) data.size = 1; // TODO
      size += data.size;
    }
    const num = size % 4;
    size += num === 0 ? 0 : 4 - num;
    const buffer = new Buffer(size);

    return buffer;
  }

  private _fillData() {
    this.buffer.reset();
    const keys = Object.keys(this._options);
    for (const key of keys) {
      const data = this._options[key];
      switch (data.type) {
        case 'f32': {
          const value = data.value;
          if (typeof value === 'number') {
            this.buffer.addFloat32(value);
          } else if (Array.isArray(value)) {
            for (const v of value) {
              this.buffer.addFloat32(v);
            }
          }
          break;
        }
      }
    }
    this.buffer.upload();
  }

  getValue(key: string) {
    return this._options[key].value;
  }
  setValue(key: string, value: any) {
    this._options[key].value = value;
    this._fillData();
  }
}
