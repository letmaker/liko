import { App } from "../app";
import { DirtyType } from "../const";
import type { Bounds } from "../math/bounds";
import { TextureBuffer } from "../render/buffer/texture-buffer";
import { Device } from "../render/device/device";
import { SpriteObject } from "../render/render/sprite-object";
import { Texture } from "../resource/texture";
import { RegNode } from "../utils/decorators";
import { Timer } from "../utils/timer";
import type { INodeOptions } from "./node";
import { type INodePrivateProps, Node } from "./node";
import type { IRenderable } from "./sprite";

// biome-ignore format:
type FontWeight ="normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
type Align = "left" | "center" | "right";

interface ITextPrivateProps extends INodePrivateProps {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  text: string;
  lines: string[];
  fillColor: string | CanvasGradient | CanvasPattern;
  strokeColor: string;
  strokeWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  italic: boolean;
  align: Align;
  lineHeight: number;
  /** 不包含 padding */
  textWidth: number;
  /** 不包含 padding */
  textHeight: number;
  texture: Texture;
  changed: boolean;
}

interface ITextOptions extends INodeOptions {
  text?: string;
  fillColor?: string | CanvasGradient | CanvasPattern;
  strokeColor?: string;
  strokeWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  italic?: boolean;
  align?: Align;
  lineHeight?: number;
}

/**
 * 文本
 */
@RegNode("Text")
export class Text extends Node implements IRenderable {
  declare pp: ITextPrivateProps;
  renderObject: SpriteObject = new SpriteObject(this);

  /** 文本边距，防止一些情况绘制不全 */
  padding = 4;

  /** 渲染纹理 */
  get texture(): Texture {
    if (this.pp.changed) this._$drawText();
    return this.pp.texture;
  }

  /** 文本内容 */
  get text() {
    return this.pp.text;
  }
  set text(value) {
    const pp = this.pp;
    if (pp.text !== value) {
      pp.text = value;
      pp.lines = pp.text.split("\n");
      this._$dirty();
    }
  }

  private _$dirty() {
    if (this.pp.changed) return;

    this.pp.changed = true;
    this.onDirty(DirtyType.texture);
    this.onDirty(DirtyType.transform);
    this.onDirty(DirtyType.size);
    Timer.callLater(this._$drawText, this);
  }

  /** 文本填充颜色 */
  get fillColor() {
    return this.pp.fillColor;
  }
  set fillColor(value) {
    if (this.pp.fillColor !== value) {
      this.pp.fillColor = value;
      this._$dirty();
    }
  }

  /** 描边颜色 */
  get strokeColor() {
    return this.pp.strokeColor;
  }
  set strokeColor(value) {
    if (this.pp.strokeColor !== value) {
      this.pp.strokeColor = value;
      this._$dirty();
    }
  }

  /** 描边宽度 */
  get strokeWidth() {
    return this.pp.strokeWidth;
  }
  set strokeWidth(value) {
    if (this.pp.strokeWidth !== value) {
      this.pp.strokeWidth = value;
      this._$dirty();
    }
  }

  /** 字体 */
  get fontFamily() {
    return this.pp.fontFamily;
  }
  set fontFamily(value) {
    if (this.pp.fontFamily !== value) {
      this.pp.fontFamily = value;
      this._$dirty();
    }
  }

  /** 字体大小 */
  get fontSize() {
    return this.pp.fontSize;
  }
  set fontSize(value) {
    if (this.pp.fontSize !== value) {
      this.pp.fontSize = value;
      this._$dirty();
    }
  }

  /** 字体粗细 */
  get fontWeight() {
    return this.pp.fontWeight;
  }
  set fontWeight(value) {
    if (this.pp.fontWeight !== value) {
      this.pp.fontWeight = value;
      this._$dirty();
    }
  }

  /** 是否是斜体 */
  get italic() {
    return this.pp.italic;
  }
  set italic(value) {
    if (this.pp.italic !== value) {
      this.pp.italic = value;
      this._$dirty();
    }
  }

  // TODO 定义为像素比较好，还是百分比
  /** 行高，此属性为百分比，实际的行高=lineHeight*fontSize */
  get lineHeight() {
    return this.pp.lineHeight;
  }
  set lineHeight(value) {
    if (this.pp.lineHeight !== value) {
      this.pp.lineHeight = value;
      this._$dirty();
    }
  }

  /** 水平对齐 */
  get align() {
    return this.pp.align;
  }
  set align(value) {
    if (this.pp.align !== value) {
      this.pp.align = value;
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

  /** 文本实际长度 */
  get textWidth() {
    return this.pp.textWidth + this.pp.strokeWidth + this.padding * 2;
  }
  /** 文本实际高度 */
  get textHeight() {
    return this.pp.textHeight + this.pp.strokeWidth + this.padding * 2;
  }

  constructor(options?: ITextOptions) {
    super();

    const pp = this.pp;
    pp.canvas = Device.createCanvas(100, 20);
    pp.ctx = pp.canvas.getContext("2d") as CanvasRenderingContext2D;
    pp.text = "";
    pp.lines = [];
    pp.fillColor = "#efefef";
    pp.strokeColor = "";
    pp.strokeWidth = 0;
    pp.fontFamily = "Arial";
    pp.fontSize = 12;
    pp.fontWeight = "normal";
    pp.align = "left";
    pp.lineHeight = 1;
    pp.textWidth = 0;
    pp.changed = false;
    pp.texture = new Texture();

    this.setProps(options as Record<string, unknown>);
    // document.body.appendChild(pp.canvas);
  }

  setText(text: string) {
    this.text = text;
  }

  private _$resetStyle() {
    const { ctx, italic, fontWeight, fontSize, fontFamily, fillColor, align, strokeColor } = this.pp;
    ctx.textBaseline = "alphabetic";
    ctx.font = `${italic ? "italic " : ""}${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fillColor;
    ctx.textAlign = align;
    ctx.strokeStyle = strokeColor;
  }

  private _$measure() {
    const { lines, ctx, fontSize, lineHeight } = this.pp;
    this._$resetStyle();

    let maxWidth = 0;
    for (const text of lines) {
      maxWidth = Math.max(Math.ceil(ctx.measureText(text).width), maxWidth);
    }

    this.pp.textWidth = maxWidth;
    this.pp.textHeight = fontSize * lineHeight * lines.length;

    const metrics = ctx.measureText("|ÉqÅM");
    return {
      /** 上升界到文本基线的距离 */
      ascent: metrics.actualBoundingBoxAscent,
      /** 字体高度=上升界到文本基线的距离+下降边界到文本基线的距离 */
      fontHeight: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  }

  protected override _customLocalBounds(bounds: Bounds) {
    bounds.addFrame(0, 0, this.textWidth, this.textHeight);
  }

  override getLocalBounds(): Bounds {
    // 获取 bounds 之前，先绘制，会调用度量文本
    if (this.pp.changed) this._$drawText();
    return super.getLocalBounds();
  }

  private _$drawText() {
    const { changed, canvas, ctx, align, strokeWidth, strokeColor, fillColor, lines, fontSize, lineHeight } = this.pp;
    if (changed) {
      this.pp.changed = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 度量文本
      const metrics = this._$measure();
      const scale = App.pixelRatio;
      const canvasWidth = Math.ceil(this.textWidth * scale);
      const canvasHeight = Math.ceil(this.textHeight * scale);

      // 重置画布大小
      this._$resizeCanvas(canvasWidth, canvasHeight);
      // 重置了 canvas 后，会丢失样式，这里重新设置一次
      this._$resetStyle();

      // textWidth 要从 this.pp 中获取，因为度量文本会修改 this.pp.textWidth
      const x = align === "left" ? 0 : align === "right" ? this.pp.textWidth : this.pp.textWidth * 0.5;
      // 行高
      const textLineHeight = fontSize * lineHeight;
      // 行间距和度量出来的字体高度之间的距离
      const lineHeightPadding = (textLineHeight - metrics.fontHeight) * 0.5;
      ctx.resetTransform();
      ctx.scale(scale, scale);
      // 确保正确应用 offset
      ctx.translate(strokeWidth * 0.5 + this.padding, strokeWidth * 0.5 + this.padding);

      if (strokeWidth && strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        for (let i = 0; i < lines.length; i++) {
          const text = lines[i];
          // ascent = 上升边界到文本基线的距离
          const y = i * textLineHeight + lineHeightPadding + metrics.ascent;
          ctx.strokeText(text, x, y);
        }
      }

      if (fillColor) {
        ctx.fillStyle = fillColor;
        for (let i = 0; i < lines.length; i++) {
          const text = lines[i];
          // ascent = 上升边界到文本基线的距离
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
      texture.set(new TextureBuffer(canvas));
      this.onDirty(DirtyType.child);
    } else {
      // 实际画布可能更大，所以需要用 sheet
      const sheet = {
        frame: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        spriteSourceSize: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        sourceSize: { w: canvasWidth, h: canvasHeight },
        rotated: false,
        trimmed: true,
      };

      texture.set(texture.buffer, undefined, sheet);
      // 宽高不变，重新更新 Texture 的图片
      texture.buffer.dirty();
    }

    // 适应轴心点变化
    if (width === -1 && height === -1) {
      this.anchor = this.anchor;
    }
  }
}
