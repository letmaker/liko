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
import { type INodePrivateProps, LikoNode } from "./node";
import type { IRenderable } from "./sprite";

// biome-ignore format:
type FontWeight ="normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
type TextAlign = "left" | "center" | "right";
type FontStyle = "normal" | "italic" | "oblique";

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
  text?: string;
  textColor?: string | CanvasGradient | CanvasPattern;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textAlign?: TextAlign;
  lineHeight?: number;
}

/**
 * 文本渲染节点，用于在场景中显示文本内容
 */
@RegNode("Text")
export class Text extends LikoNode implements IRenderable {
  declare pp: ITextPrivateProps;
  renderObject: SpriteObject = new SpriteObject(this);

  /** 文本边距，防止文本在某些情况下绘制不完整 */
  padding = 4;

  /** 获取渲染纹理 */
  get texture(): Texture {
    if (this.pp.changed) this._$drawText();
    return this.pp.texture;
  }

  /** 获取或设置文本内容 */
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
    this.markDirty(DirtyType.texture);
    this.markDirty(DirtyType.transform);
    this.markDirty(DirtyType.size);
    Timer.callLater(this._$drawText, this);
  }

  /** 获取或设置文本颜色 */
  get textColor() {
    return this.pp.textColor;
  }
  set textColor(value) {
    if (this.pp.textColor !== value) {
      this.pp.textColor = value;
      this._$dirty();
    }
  }

  /** 获取或设置文本描边颜色 */
  get textStrokeColor() {
    return this.pp.textStrokeColor;
  }
  set textStrokeColor(value) {
    if (this.pp.textStrokeColor !== value) {
      this.pp.textStrokeColor = value;
      this._$dirty();
    }
  }

  /** 获取或设置文本描边宽度 */
  get textStrokeWidth() {
    return this.pp.textStrokeWidth;
  }
  set textStrokeWidth(value) {
    if (this.pp.textStrokeWidth !== value) {
      this.pp.textStrokeWidth = value;
      this._$dirty();
    }
  }

  /** 获取或设置字体名称 */
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

  /** 获取或设置字体粗细 */
  get fontWeight() {
    return this.pp.fontWeight;
  }
  set fontWeight(value) {
    if (this.pp.fontWeight !== value) {
      this.pp.fontWeight = value;
      this._$dirty();
    }
  }

  /** 获取或设置字体样式 */
  get fontStyle() {
    return this.pp.fontStyle;
  }
  set fontStyle(value) {
    if (this.pp.fontStyle !== value) {
      this.pp.fontStyle = value;
      this._$dirty();
    }
  }

  /** 获取或设置行高，单位为像素，一般最好大于字号 */
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

  /** 获取或设置文本水平对齐方式 */
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

  /** 获取文本实际宽度（包含描边和内边距） */
  get textWidth() {
    return this.pp.measureWidth + this.pp.textStrokeWidth + this.padding * 2;
  }

  /** 获取文本实际高度（包含描边和内边距） */
  get textHeight() {
    return this.pp.measureHeight + this.pp.textStrokeWidth + this.padding * 2;
  }

  /**
   * 创建文本节点
   * @param options - 文本节点配置选项
   */
  constructor(options?: ITextOptions) {
    super();

    const pp = this.pp;
    pp.canvas = Device.createCanvas(100, 20);
    pp.ctx = pp.canvas.getContext("2d") as CanvasRenderingContext2D;
    pp.text = "";
    pp.lines = [];
    pp.textColor = "#efefef";
    pp.textStrokeColor = "";
    pp.textStrokeWidth = 0;
    pp.fontFamily = "Arial";
    pp.fontSize = 12;
    pp.fontWeight = "normal";
    pp.textAlign = "left";
    pp.lineHeight = 0;
    pp.measureWidth = 0;
    pp.measureHeight = 0;
    pp.changed = false;
    pp.texture = new Texture();

    this.setProps(options as Record<string, unknown>);
    // document.body.appendChild(pp.canvas);
  }

  /**
   * 释放文本节点占用的资源
   */
  override destroy() {
    this.pp.texture.destroy();
    super.destroy();
  }

  /**
   * 设置文本内容
   * @param text - 要设置的文本内容
   */
  setText(text: string) {
    this.text = text;
  }

  private _$resetStyle() {
    const { ctx, fontStyle, fontWeight, fontSize, fontFamily, textColor, textAlign, textStrokeColor } = this.pp;
    ctx.textBaseline = "alphabetic";
    ctx.font = `${fontStyle ? `${fontStyle} ` : ""}${fontWeight} ${fontSize}px ${fontFamily}`;
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

    const metrics = ctx.measureText("|ÉqÅM");
    return {
      /** 上升界到文本基线的距离 */
      ascent: metrics.actualBoundingBoxAscent,
      /** 字体高度 = 上升界到文本基线的距离 + 下降边界到文本基线的距离 */
      fontHeight: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  }

  /**
   * 自定义本地边界计算
   * @param bounds - 边界对象
   */
  protected override _customLocalBounds(bounds: Bounds) {
    bounds.addFrame(0, 0, this.textWidth, this.textHeight);
  }

  /**
   * 获取文本节点的本地边界
   * @returns 本地边界对象
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

      // 度量文本
      const metrics = this._$measure();
      const scale = App.pixelRatio;
      const canvasWidth = Math.ceil(this.textWidth * scale);
      const canvasHeight = Math.ceil(this.textHeight * scale);

      // 重置画布大小
      this._$resizeCanvas(canvasWidth, canvasHeight);
      // 重置了 canvas 后，会丢失样式，这里重新设置一次
      this._$resetStyle();

      // 根据对齐方式计算 x 坐标
      const x = textAlign === "left" ? 0 : textAlign === "right" ? this.pp.measureWidth : this.pp.measureWidth * 0.5;
      // 计算行高
      const textLineHeight = this.lineHeight;
      // 计算行间距和度量出来的字体高度之间的距离
      const lineHeightPadding = (textLineHeight - metrics.fontHeight) * 0.5;
      ctx.resetTransform();
      ctx.scale(scale, scale);
      // 应用偏移量确保文本正确显示
      ctx.translate(textStrokeWidth * 0.5 + this.padding, textStrokeWidth * 0.5 + this.padding);

      // 绘制描边
      if (textStrokeWidth && textStrokeColor) {
        ctx.strokeStyle = textStrokeColor;
        ctx.lineWidth = textStrokeWidth;

        for (let i = 0; i < lines.length; i++) {
          const text = lines[i];
          // ascent = 上升边界到文本基线的距离
          const y = i * textLineHeight + lineHeightPadding + metrics.ascent;
          ctx.strokeText(text, x, y);
        }
      }

      // 绘制文本填充
      if (textColor) {
        ctx.fillStyle = textColor;
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
      texture.setBuffer(new TextureBuffer(canvas));
      this.markDirty(DirtyType.child);
    } else {
      // 实际画布可能更大，所以需要用 sheet
      const sheet = {
        frame: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        spriteSourceSize: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        sourceSize: { w: canvasWidth, h: canvasHeight },
        rotated: false,
        trimmed: true,
      };

      texture.setBuffer(texture.buffer, undefined, sheet);
      // 宽高不变，重新更新 Texture 的图片
      texture.buffer.dirty();
    }

    // 适应轴心点变化
    if (width === -1 && height === -1) {
      this.anchor = this.anchor;
    }
  }
}
