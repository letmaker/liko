import { App } from "../app";
import { DirtyType } from "../const";
import type { Bounds } from "../math/bounds";
import { TextureBuffer } from "../render/buffer/texture-buffer";
import { Device } from "../render/device/device";
import { SpriteObject } from "../render/render/sprite-object";
import { Texture } from "../resource/texture";
import { RegNode } from "../utils/decorators";
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
    if (this.pp.changed) this.__drawText();
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
      pp.changed = true;
    }
  }

  /** 文本填充颜色 */
  get fillColor() {
    return this.pp.fillColor;
  }
  set fillColor(value) {
    if (this.pp.fillColor !== value) {
      this.pp.fillColor = value;
      this.pp.changed = true;
    }
  }

  /** 描边颜色 */
  get strokeColor() {
    return this.pp.strokeColor;
  }
  set strokeColor(value) {
    if (this.pp.strokeColor !== value) {
      this.pp.strokeColor = value;
      this.pp.changed = true;
    }
  }

  /** 描边宽度 */
  get strokeWidth() {
    return this.pp.strokeWidth;
  }
  set strokeWidth(value) {
    if (this.pp.strokeWidth !== value) {
      this.pp.strokeWidth = value;
      this.pp.changed = true;
    }
  }

  /** 字体 */
  get fontFamily() {
    return this.pp.fontFamily;
  }
  set fontFamily(value) {
    if (this.pp.fontFamily !== value) {
      this.pp.fontFamily = value;
      this.pp.changed = true;
    }
  }

  /** 字体大小 */
  get fontSize() {
    return this.pp.fontSize;
  }
  set fontSize(value) {
    if (this.pp.fontSize !== value) {
      this.pp.fontSize = value;
      this.pp.changed = true;
    }
  }

  /** 字体粗细 */
  get fontWeight() {
    return this.pp.fontWeight;
  }
  set fontWeight(value) {
    if (this.pp.fontWeight !== value) {
      this.pp.fontWeight = value;
      this.pp.changed = true;
    }
  }

  /** 是否是斜体 */
  get italic() {
    return this.pp.italic;
  }
  set italic(value) {
    if (this.pp.italic !== value) {
      this.pp.italic = value;
      this.pp.changed = true;
    }
  }

  /** 行高，此属性为百分比，实际的行高=lineHeight*fontSize */
  get lineHeight() {
    return this.pp.lineHeight;
  }
  set lineHeight(value) {
    if (this.pp.lineHeight !== value) {
      this.pp.lineHeight = value;
      this.pp.changed = true;
    }
  }

  /** 水平对齐 */
  get align() {
    return this.pp.align;
  }
  set align(value) {
    if (this.pp.align !== value) {
      this.pp.align = value;
      this.pp.changed = true;
    }
  }

  get width(): number {
    return super.width;
  }
  set width(value: number) {
    if (this.pp.width !== value) {
      super.width = value;
      this.pp.changed = true;
    }
  }

  get height(): number {
    return super.height;
  }
  set height(value: number) {
    if (this.pp.height !== value) {
      super.height = value;
      this.pp.changed = true;
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
    pp.fillColor = "";
    pp.strokeColor = "#efefef";
    pp.strokeWidth = 0;
    pp.fontFamily = "Arial";
    pp.fontSize = 12;
    pp.fontWeight = "normal";
    pp.align = "left";
    pp.lineHeight = 1;
    pp.textWidth = 0;
    pp.changed = false;
    pp.texture = Texture.BLANK;

    this.setProps(options as Record<string, unknown>);
    // document.body.appendChild(pp.canvas);
  }

  private __resetStyle() {
    const pp = this.pp;
    const ctx = pp.ctx;
    ctx.textBaseline = "alphabetic";
    ctx.font = `${pp.italic ? "italic " : ""}${pp.fontWeight} ${pp.fontSize}px ${pp.fontFamily}`;
    ctx.fillStyle = pp.fillColor;
    ctx.textAlign = pp.align;
    ctx.strokeStyle = pp.strokeColor;
  }

  private __measure() {
    const pp = this.pp;
    this.__resetStyle();

    let maxWidth = 0;
    for (const text of this.pp.lines) {
      maxWidth = Math.max(Math.ceil(this.pp.ctx.measureText(text).width), maxWidth);
    }

    pp.textWidth = maxWidth;
    pp.textHeight = pp.fontSize * pp.lineHeight * pp.lines.length;

    const metrics = this.pp.ctx.measureText("|ÉqÅM");
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

  getLocalBounds(): Bounds {
    // 获取 bounds 之前，先绘制
    if (this.pp.changed) this.__drawText();
    return super.getLocalBounds();
  }

  getWorldBounds(): Bounds {
    // 获取 bounds 之前，先绘制
    if (this.pp.changed) this.__drawText();
    return super.getWorldBounds();
  }

  private __drawText() {
    const pp = this.pp;
    if (pp.changed) {
      pp.changed = false;
      this.onDirty(DirtyType.texture);
      pp.ctx.clearRect(0, 0, pp.canvas.width, pp.canvas.height);

      // 度量文本
      const metrics = this.__measure();
      const scale = App.pixelRatio;

      // 根据大小，重置画布及 texture
      this.__resizeCanvas(Math.ceil(this.textWidth * scale), Math.ceil(this.textHeight * scale));
      // 重置了 canvas 后，会丢失样式，这里重新设置一次
      this.__resetStyle();

      const ctx = pp.ctx;
      const startX = pp.align === "left" ? 0 : pp.align === "right" ? pp.textWidth : pp.textWidth * 0.5;
      const x = startX + pp.strokeWidth * 0.5 + this.padding;
      // 行高
      const lineHeight = pp.fontSize * pp.lineHeight;
      // 行间距和度量出来的字体高度之间的距离
      const lineHeightPadding = (lineHeight - metrics.fontHeight) * 0.5;
      ctx.resetTransform();
      ctx.scale(scale, scale);

      if (pp.strokeWidth && pp.strokeColor) {
        ctx.strokeStyle = pp.strokeColor;
        ctx.lineWidth = pp.strokeWidth;

        for (let i = 0; i < pp.lines.length; i++) {
          const text = pp.lines[i];
          // ascent = 上升边界到文本基线的距离
          const y = i * lineHeight + lineHeightPadding + metrics.ascent + pp.strokeWidth * 0.5 + this.padding;
          ctx.strokeText(text, x, y);
        }
      }

      if (pp.fillColor) {
        ctx.fillStyle = pp.fillColor;
        for (let i = 0; i < pp.lines.length; i++) {
          const text = pp.lines[i];
          // ascent = 上升边界到文本基线的距离
          const y = i * lineHeight + lineHeightPadding + metrics.ascent + pp.strokeWidth * 0.5 + this.padding;
          ctx.fillText(text, x, y);
        }
      }
    }
  }

  private __resizeCanvas(canvasWidth: number, canvasHeight: number) {
    const pp = this.pp;
    const canvas = pp.canvas;

    // 实际画布可能更大，所以需要用 sheet
    const sheet = {
      frame: { x: 0, y: 0, w: canvasWidth, h: canvasWidth },
      spriteSourceSize: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
      sourceSize: { w: canvasWidth, h: canvasHeight },
      rotated: false,
      trimmed: false,
    };

    // 根据画布大小，创建 Texture
    if (canvasWidth > canvas.width || canvasHeight > canvas.height || pp.texture === Texture.BLANK) {
      if (pp.texture === Texture.BLANK) pp.texture = new Texture();
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      pp.texture.set(new TextureBuffer(canvas));
    } else {
      pp.texture.set(pp.texture.buffer, undefined, sheet);
      // 宽高不变，重新更新 Texture 的图片
      pp.texture.buffer.dirty();
    }
  }
}
