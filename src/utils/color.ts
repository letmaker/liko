/** 匹配 RGBA 格式的正则表达式 */
const RGBA_PATTERN = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i;
const RGB_PATTERN = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i;
const HEX_PATTERN = /^(#|0x)([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export type ColorHex = `#${string}` | `0x${string}`;
export type ColorRGBA = `rgba(${number},${number},${number},${number})`;
export type ColorRGB = `rgb(${number},${number},${number})`;
export type ColorData = ColorHex | ColorRGBA | ColorRGB | number;

/**
 * 颜色类，用于处理和转换不同格式的颜色
 * @remarks 支持的颜色格式：0xff0000, '#rrggbb', '0xrrggbb', 'rgb(0-255,0-255,0-255)', 'rgba(0-255,0-255,0-255,0-1)'
 */
export class Color {
  /** 默认白色颜色实例，请不要修改 */
  static readonly Default = new Color(0xffffff);

  private _color = new Float32Array([1, 1, 1, 1]);
  private _value: ColorData = "#ffffff";

  /** webGPU 使用的颜色值，ARGB 格式的整数 */
  argb = 0;

  constructor(value?: ColorData) {
    this.value = value ?? 0xffffff;
  }

  /**
   * 设置颜色值
   * @param value - 支持的颜色格式：0xff0000, '#rrggbb', '0xrrggbb', 'rgb(0-255,0-255,0-255)', 'rgba(0-255,0-255,0-255,0-1)'
   */
  set value(value: ColorData) {
    if (this._value !== value) {
      this._value = value;
      this._parseColor(value);
    }
  }

  /** 获取原始颜色值 */
  get value(): ColorData {
    return this._value;
  }

  /**
   * 解析颜色值为内部表示
   * @param value - 要解析的颜色值
   */
  private _parseColor(value: ColorData) {
    let [r, g, b, a] = [0, 0, 0, 1];
    switch (typeof value) {
      case "number": {
        const uint = value;
        r = (uint >> 16) & 0xff;
        g = (uint >> 8) & 0xff;
        b = uint & 0xff;
        break;
      }
      case "string": {
        // 匹配 'rgba(r, g, b, a)'
        if (value.startsWith("rgba")) {
          const rgbaMatch = value.match(RGBA_PATTERN);
          if (rgbaMatch) {
            r = Number(rgbaMatch[1]);
            g = Number(rgbaMatch[2]);
            b = Number(rgbaMatch[3]);
            a = Number(rgbaMatch[4]);
          }
        } else if (value.startsWith("rgb")) {
          // 匹配 'rgb(r, g, b)'
          const rgbMatch = value.match(RGB_PATTERN);
          if (rgbMatch) {
            r = Number(rgbMatch[1]);
            g = Number(rgbMatch[2]);
            b = Number(rgbMatch[3]);
          }
        } else if (value.startsWith("#") || value.startsWith("0x")) {
          // 匹配 "#rrggbb","0xrrggbb"
          const hexMatch = value.match(HEX_PATTERN);
          if (hexMatch) {
            r = Number.parseInt(hexMatch[2], 16);
            g = Number.parseInt(hexMatch[3], 16);
            b = Number.parseInt(hexMatch[4], 16);
          }
        }
        break;
      }
    }

    this._color[0] = r / 255;
    this._color[1] = g / 255;
    this._color[2] = b / 255;
    this._color[3] = a;

    const intAlpha = a * 255;
    this.argb = (intAlpha << 24) | (r << 16) | (g << 8) | b;
  }

  /** 获取红色值，范围：0 - 1 */
  get red(): number {
    return this._color[0];
  }

  /** 获取绿色值，范围：0 - 1 */
  get green(): number {
    return this._color[1];
  }

  /** 获取蓝色值，范围：0 - 1 */
  get blue(): number {
    return this._color[2];
  }

  /** 获取透明度值，范围：0 - 1 */
  get alpha(): number {
    return this._color[3];
  }

  /**
   * 获取 RGBA 字符串
   * @returns RGBA 格式的颜色字符串
   */
  toString(): string {
    const [r, g, b] = this._color.map((v) => v * 255);
    return `rgba(${r},${g},${b},${this._color[3]})`;
  }

  /**
   * 更改颜色的透明度
   * @param alpha - 新的透明度值，范围 0-1
   */
  changeAlpha(alpha: number) {
    this._color[3] = alpha;
    const [r, g, b, a] = this._color.map((v) => v * 255);
    this.argb = (a << 24) | (r << 16) | (g << 8) | b;
  }
}
