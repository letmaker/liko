const RGBA_PATTERN = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i;
const HEX_PATTERN = /^(#|0x)([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

/** 颜色类型 */
export type ColorData = string | number;

/**
 * 支持的颜色格式：0xff0000,'rgba(0-255,0-255,0-255,0-1)','#rrggbb','0xrrggbb'
 */
export class Color {
  /** 默认颜色，请不要修改 */
  static readonly Default = new Color();

  private _color = new Float32Array([1, 1, 1, 1]);
  private _value: ColorData = "";

  /** gpu 使用的颜色，不要手动修改 */
  argb = 0;

  constructor(value: ColorData = "rgba(255,255,255,1)") {
    this.value = value;
  }

  /**
   * 传入的原始颜色值，支持 0xff0000,'rgba(0-255,0-255,0-255,0-1)','#rrggbb','0xrrggbb'
   */
  set value(value: ColorData) {
    if (this._value !== value) {
      this._value = value;
      this._praseColor(value);
    }
  }
  get value(): ColorData {
    return this._value;
  }

  private _praseColor(value: ColorData) {
    let rgbaArray = [1, 1, 1, 1];
    let [r, g, b, a] = rgbaArray;
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
        const rgbaMatch = value.match(RGBA_PATTERN);
        if (rgbaMatch) {
          rgbaArray = rgbaMatch.slice(1, 5).map(Number);
          a = rgbaArray[3];
        } else {
          // 匹配 "#rrggbb","0xrrggbb"
          const hexMatch = value.match(HEX_PATTERN);
          if (hexMatch) {
            rgbaArray = hexMatch.map((hex) => Number.parseInt(hex, 16));
          }
        }
        [r, g, b] = rgbaArray;
        break;
      }
    }

    this._color[0] = r / 255;
    this._color[1] = g / 255;
    this._color[2] = b / 255;
    this._color[3] = a / 255;

    this.argb = (a << 24) | (r << 16) | (g << 8) | b;
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

  /** 获取 rgba 字符串 */
  toString(): string {
    const [r, g, b, a] = this._color.map((v) => Math.round(v * 255));
    return `rgba(${r},${g},${b},${a})`;
  }

  /**
   * 更改颜色的 alpha 值
   * @param value alpha 值，范围 0-1
   */
  changeAlpha(alpha: number) {
    this._color[3] = alpha;
    const [r, g, b, a] = this._color.map((v) => Math.round(v * 255));
    this.argb = (a << 24) | (r << 16) | (g << 8) | b;
  }
}
