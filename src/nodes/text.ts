import { App } from '../app';
import { DirtyType } from '../const';
import type { Bounds } from '../math/bounds';
import { TextureBuffer } from '../render/buffer/texture-buffer';
import { SpriteObject } from '../render/render/sprite-object';
import { Texture } from '../resource/texture';
import { RegNode } from '../utils/decorators';
import { Timer } from '../utils/timer';
import { createCanvas } from '../utils/utils';
import type { INodeOptions } from './node';
import { type INodePrivateProps, LikoNode } from './node';
import type { IRenderable } from './sprite';

// biome-ignore format:
type FontWeight = "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
type TextAlign = 'left' | 'center' | 'right';
type FontStyle = 'normal' | 'italic' | 'oblique';

interface ITextPrivateProps extends INodePrivateProps {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  text: string;
  lines: string[];
  textColor: string | CanvasGradient | CanvasPattern;
  textStrokeColor: string;
  textStrokeWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  textAlign: TextAlign;
  lineHeight: number;
  measureWidth: number;
  measureHeight: number;
  texture: Texture;
  changed: boolean;
}

interface ITextOptions extends INodeOptions {
  /** 文本内容 */
  text?: string;
  /** 文本颜色 */
  textColor?: string | CanvasGradient | CanvasPattern;
  /** 文本描边颜色 */
  textStrokeColor?: string;
  /** 文本描边宽度 */
  textStrokeWidth?: number;
  /** 字体名称 */
  fontFamily?: string;
  /** 字体大小，单位为像素 */
  fontSize?: number;
  /** 字体粗细 */
  fontWeight?: FontWeight;
  /** 字体样式 */
  fontStyle?: FontStyle;
  /** 文本水平对齐方式 */
  textAlign?: TextAlign;
  /** 行高，单位为像素，默认为字号大小 */
  lineHeight?: number;
}

/**
 * 文本渲染节点，用于在场景中显示文本内容
 *
 * 支持多行文本、字体样式设置、颜色填充、描边效果、文本对齐等功能。
 *
 * @example
 * ```typescript
 * // 创建基本文本
 * const text = new Text({
 *   text: 'Hello World',
 *   fontSize: 24,
 *   textColor: 'white'
 * });
 *
 * // 创建多行文本
 * const multiLineText = new Text({
 *   text: 'Line 1\nLine 2\nLine 3',
 *   fontSize: 16,
 *   lineHeight: 20,
 *   textAlign: 'center'
 * });
 *
 * // 创建带描边的文本
 * const strokeText = new Text({
 *   text: 'Outlined Text',
 *   fontSize: 32,
 *   textColor: 'yellow',
 *   textStrokeColor: 'black',
 *   textStrokeWidth: 2
 * });
 *
 * // 动态修改文本属性
 * text.text = 'Updated Text';
 * text.fontSize = 18;
 * text.fontWeight = 'bold';
 * text.textAlign = 'right';
 *
 * // 设置自定义字体
 * const customFont = new Text({
 *   text: 'Custom Font',
 *   fontFamily: 'Arial, sans-serif',
 *   fontStyle: 'italic',
 *   fontWeight: '600'
 * });
 * ```
 *
 * @注意事项
 * - 文本内容支持换行符(\n)自动分行
 * - 修改任何样式属性都会触发重绘，频繁修改可能影响性能
 * - 画布会根据文本内容自动调整大小，包含内边距和描边宽度
 * - 当 width 和 height 为 -1 时，会自动适应文本实际大小
 * - 支持 CanvasGradient 和 CanvasPattern 作为文本颜色
 * - 文本对齐基于文本的测量宽度，不是节点的 width 属性
 * - lineHeight 为 0 时会使用 fontSize 作为行高
 * - 描边会增加文本的实际显示尺寸
 */
@RegNode('Text')
export class Text extends LikoNode implements IRenderable {
  declare pp: ITextPrivateProps;
  readonly renderObject: SpriteObject = new SpriteObject(this);

  /** 文本边距，防止文本在某些情况下绘制不完整，特别是斜体字或特殊字符 */
  padding = 4;

  /** 获取渲染纹理，如果文本内容已更改则重新绘制。空文本返回空白纹理 */
  get texture(): Texture {
    if (!this.pp.text) return Texture.BLANK;
    if (this.pp.changed) this._$drawText();
    return this.pp.texture;
  }

  /** 获取或设置文本内容，设置时会自动按换行符(\n)分割成多行，触发重绘 */
  get text() {
    return this.pp.text;
  }
  set text(value) {
    const pp = this.pp;
    if (pp.text !== value) {
      pp.text = value;
      pp.lines = pp.text.split('\n');
      this._$dirty();
    }
  }

  private _$dirty() {
    if (this.pp.changed) return;

    this.pp.changed = true;
    this.markDirty(DirtyType.texture);
    this.markDirty(DirtyType.transform);
    this.markDirty(DirtyType.size);
    Timer.callLater(this._$drawText, this);
  }

  /** 获取或设置文本颜色，支持颜色字符串、渐变或图案 */
  get textColor() {
    return this.pp.textColor;
  }
  set textColor(value) {
    if (this.pp.textColor !== value) {
      this.pp.textColor = value;
      this._$dirty();
    }
  }

  /** 获取或设置文本描边颜色，为空时不绘制描边 */
  get textStrokeColor() {
    return this.pp.textStrokeColor;
  }
  set textStrokeColor(value) {
    if (this.pp.textStrokeColor !== value) {
      this.pp.textStrokeColor = value;
      this._$dirty();
    }
  }

  /** 获取或设置文本描边宽度，为 0 时不绘制描边 */
  get textStrokeWidth() {
    return this.pp.textStrokeWidth;
  }
  set textStrokeWidth(value) {
    if (this.pp.textStrokeWidth !== value) {
      this.pp.textStrokeWidth = value;
      this._$dirty();
    }
  }

  /** 获取或设置字体名称，例如 "Arial"、"Helvetica" 等 */
  get fontFamily() {
    return this.pp.fontFamily;
  }
  set fontFamily(value) {
    if (this.pp.fontFamily !== value) {
      this.pp.fontFamily = value;
      this._$dirty();
    }
  }

  /** 获取或设置字体大小，单位为像素 */
  get fontSize() {
    return this.pp.fontSize;
  }
  set fontSize(value) {
    if (this.pp.fontSize !== value) {
      this.pp.fontSize = value;
      this._$dirty();
    }
  }

  /** 获取或设置字体粗细，可以是预定义值或数字字符串 */
  get fontWeight() {
    return this.pp.fontWeight;
  }
  set fontWeight(value) {
    if (this.pp.fontWeight !== value) {
      this.pp.fontWeight = value;
      this._$dirty();
    }
  }

  /** 获取或设置字体样式，如 normal、italic 或 oblique */
  get fontStyle() {
    return this.pp.fontStyle;
  }
  set fontStyle(value) {
    if (this.pp.fontStyle !== value) {
      this.pp.fontStyle = value;
      this._$dirty();
    }
  }

  /** 获取或设置行高，单位为像素。当设置为 0 或负数时，自动使用字体大小作为行高 */
  get lineHeight() {
    const { lineHeight, fontSize } = this.pp;
    return lineHeight > 0 ? lineHeight : fontSize;
  }
  set lineHeight(value) {
    if (this.pp.lineHeight !== value) {
      this.pp.lineHeight = value;
      this._$dirty();
    }
  }

  /** 获取或设置文本水平对齐方式，可选值为 left、center 或 right */
  get textAlign() {
    return this.pp.textAlign;
  }
  set textAlign(value) {
    if (this.pp.textAlign !== value) {
      this.pp.textAlign = value;
      this._$dirty();
    }
  }

  override get width(): number {
    return super.width;
  }
  override set width(value: number) {
    if (this.pp.width !== value) {
      super.width = value;
      this._$dirty();
    }
  }

  override get height(): number {
    return super.height;
  }
  override set height(value: number) {
    if (this.pp.height !== value) {
      super.height = value;
      this._$dirty();
    }
  }

  /** 获取文本实际渲染宽度（包含描边宽度和内边距）*/
  get textWidth() {
    return this.pp.measureWidth + this.pp.textStrokeWidth + this.padding * 2;
  }

  /** 获取文本实际渲染高度（包含描边宽度和内边距）*/
  get textHeight() {
    return this.pp.measureHeight + this.pp.textStrokeWidth + this.padding * 2;
  }

  constructor(options?: ITextOptions) {
    super();

    const pp = this.pp;
    pp.canvas = createCanvas(100, 20);
    pp.ctx = pp.canvas.getContext('2d') as CanvasRenderingContext2D;
    pp.text = '';
    pp.lines = [];
    pp.textColor = '#efefef';
    pp.textStrokeColor = '';
    pp.textStrokeWidth = 0;
    pp.fontFamily = 'Arial';
    pp.fontSize = 12;
    pp.fontWeight = 'normal';
    pp.fontStyle = 'normal';
    pp.textAlign = 'left';
    pp.lineHeight = 0;
    pp.measureWidth = 0;
    pp.measureHeight = 0;
    pp.changed = false;
    pp.texture = new Texture();

    this.setProps(options as Record<string, unknown>);
    // document.body.appendChild(pp.canvas);
  }

  /**
   * 释放文本节点占用的资源，包括销毁纹理和画布
   */
  override destroy(): void {
    this.pp.texture.destroy();
    super.destroy();
  }

  /**
   * 设置文本内容
   * @param text - 要设置的文本内容
   * @returns 当前实例，支持链式调用
   */
  setText(text: string): this {
    this.text = text;
    return this;
  }

  private _$resetStyle() {
    const { ctx, fontStyle, fontWeight, fontSize, fontFamily, textColor, textAlign, textStrokeColor } = this.pp;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontStyle ? `${fontStyle} ` : ''}${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = textAlign;
    ctx.strokeStyle = textStrokeColor;
  }

  private _$measure() {
    const { lines, ctx } = this.pp;
    this._$resetStyle();

    let maxWidth = 0;
    for (const text of lines) {
      maxWidth = Math.max(Math.ceil(ctx.measureText(text).width), maxWidth);
    }

    this.pp.measureWidth = maxWidth;
    this.pp.measureHeight = this.lineHeight * lines.length;

    const metrics = ctx.measureText('|ÉqÅM');
    return {
      /** 上升界到文本基线的距离 */
      ascent: metrics.actualBoundingBoxAscent,
      /** 字体高度 = 上升界到文本基线的距离 + 下降边界到文本基线的距离 */
      fontHeight: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  }

  /**
   * 自定义本地边界计算，使用文本的实际渲染尺寸作为边界
   * 确保边界包含完整的文本内容、描边和内边距
   */
  protected override _customLocalBounds(bounds: Bounds) {
    bounds.addFrame(0, 0, this.textWidth, this.textHeight);
  }

  /**
   * 获取文本节点的本地边界，会自动触发文本重绘和尺寸测量
   * 确保返回的边界反映最新的文本内容和样式
   */
  override getLocalBounds(): Bounds {
    // 获取 bounds 之前，先绘制，会调用度量文本
    if (this.pp.changed) this._$drawText();
    return super.getLocalBounds();
  }

  private _$drawText() {
    const { changed, canvas, ctx, textAlign, textStrokeWidth, textStrokeColor, textColor, lines } = this.pp;
    if (changed) {
      this.pp.changed = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 度量文本尺寸
      const metrics = this._$measure();
      const scale = App.pixelRatio;
      const canvasWidth = Math.ceil(this.textWidth * scale);
      const canvasHeight = Math.ceil(this.textHeight * scale);

      // 重置画布大小
      this._$resizeCanvas(canvasWidth, canvasHeight);
      // 重置了 canvas 后，会丢失样式，这里重新设置一次
      this._$resetStyle();

      // 根据对齐方式计算 x 坐标
      const x = textAlign === 'left' ? 0 : textAlign === 'right' ? this.pp.measureWidth : this.pp.measureWidth * 0.5;
      // 计算文本行高
      const textLineHeight = this.lineHeight;
      // 计算行间距和度量出来的字体高度之间的距离，用于垂直居中
      const lineHeightPadding = (textLineHeight - metrics.fontHeight) * 0.5;
      ctx.resetTransform();
      ctx.scale(scale, scale);
      // 应用偏移量确保文本正确显示，考虑描边宽度和内边距
      ctx.translate(textStrokeWidth * 0.5 + this.padding, textStrokeWidth * 0.5 + this.padding);

      // 绘制描边
      if (textStrokeWidth && textStrokeColor) {
        ctx.strokeStyle = textStrokeColor;
        ctx.lineWidth = textStrokeWidth;

        for (let i = 0; i < lines.length; i++) {
          const text = lines[i];
          // ascent = 上升边界到文本基线的距离，用于精确定位文本
          const y = i * textLineHeight + lineHeightPadding + metrics.ascent;
          ctx.strokeText(text, x, y);
        }
      }

      // 绘制文本填充
      if (textColor) {
        ctx.fillStyle = textColor;
        for (let i = 0; i < lines.length; i++) {
          const text = lines[i];
          // ascent = 上升边界到文本基线的距离，用于精确定位文本
          const y = i * textLineHeight + lineHeightPadding + metrics.ascent;
          ctx.fillText(text, x, y);
        }
      }
    }
  }

  private _$resizeCanvas(canvasWidth: number, canvasHeight: number) {
    const { canvas, texture, width, height } = this.pp;

    if (canvasWidth > canvas.width || canvasHeight > canvas.height) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      texture.setBuffer(new TextureBuffer(canvas));
      this.markDirty(DirtyType.child);
    } else {
      // 实际画布可能更大，所以需要用 sheet 来指定有效区域
      const sheet = {
        frame: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        spriteSourceSize: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        sourceSize: { w: canvasWidth, h: canvasHeight },
        rotated: false,
        trimmed: true,
      };

      texture.setBuffer(texture.buffer, undefined, sheet);
      // 宽高不变，仅更新 Texture 的图片内容
      texture.buffer.dirty();
    }

    // 适应轴心点变化，确保渲染位置正确
    if (width === -1 && height === -1) {
      // 确保 boundsDirty 被设置为 true，这样后续调用 getLocalBounds 时会重新计算
      this.pp.boundsDirty = true;
      this.anchor = this.anchor;
    }
  }
}
