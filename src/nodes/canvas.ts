import { App } from "../app";
import { DirtyType, PI2 } from "../const";
import { Bounds } from "../math/bounds";
import { Point } from "../math/point";
import { TextureBuffer } from "../render/buffer/texture-buffer";
import { Device } from "../render/device/device";
import { SpriteObject } from "../render/render/sprite-object";
import { Texture } from "../resource/texture";
import { RegNode } from "../utils/decorators";
import type { INodeOptions, INodePrivateProps } from "./node";
import { Node } from "./node";
import type { IRenderable } from "./sprite";

interface ICanvasPrivateProps extends INodePrivateProps {
  bounds: Bounds;
  cmd: Array<{ type: string; params: any }>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  offset: Point;
  maxLineWidth: number;
  texture: Texture;
  changed: boolean;
}

/**
 * Canvas 矢量图
 */
@RegNode("Canvas")
export class Canvas extends Node implements IRenderable {
  declare pp: ICanvasPrivateProps;
  renderObject: SpriteObject = new SpriteObject(this);

  constructor(options?: INodeOptions) {
    super(options);

    const pp = this.pp;
    pp.bounds = new Bounds();
    pp.cmd = [];
    pp.canvas = Device.createCanvas(1, 1);
    pp.ctx = pp.canvas.getContext("2d") as CanvasRenderingContext2D;
    pp.offset = new Point();
    pp.maxLineWidth = 0;
    pp.texture = Texture.BLANK;
    pp.changed = false;

    // document.body.appendChild(pp.canvas);
  }

  /** 渲染纹理 */
  get texture(): Texture {
    if (this.pp.changed) this._$drawCanvas();
    return this.pp.texture;
  }

  /**
   * 清理绘制
   */
  clear(): this {
    const pp = this.pp;
    pp.cmd.length = 0;
    pp.bounds.reset();
    pp.ctx.clearRect(0, 0, pp.canvas.width, pp.canvas.height);
    pp.changed = true;
    return this;
  }

  /**
   * 绘制一个矩形
   * @param x 起点的 x 坐标
   * @param y 起点的 y 坐标
   * @param width 宽度
   * @param height 高度
   */
  rect(x: number, y: number, width: number, height: number): this {
    console.assert(width >= 0 && height >= 0);
    this.pp.cmd.push({ type: "rect", params: [x, y, width, height] });
    this._$addPoint(x, y);
    this._$addPoint(x + width, y + height);
    return this;
  }

  /**
   * 绘制圆角矩形
   * @param x 起点的 x 坐标
   * @param y 起点的 y 坐标
   * @param width 宽度
   * @param height 高度
   * @param radii 圆角
   */
  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radii?: number | DOMPointInit | (number | DOMPointInit)[],
  ): this {
    this.pp.cmd.push({ type: "roundRect", params: [x, y, width, height, radii] });
    this._$addPoint(x, y);
    this._$addPoint(x + width, y + height);
    return this;
  }

  /**
   * 绘制一个圆形，通过设置 startAngle 和 endAngle，还可以绘制圆弧
   * @param x 圆心的 x 坐标
   * @param y 圆心的 y 坐标
   * @param radius 半径
   */
  circle(x: number, y: number, radius: number): this {
    this.pp.cmd.push({ type: "arc", params: [x, y, radius, 0, PI2] });
    this._$addPoint(x - radius, y - radius);
    this._$addPoint(x + radius, y + radius);
    return this;
  }

  /**
   * 绘制一个椭圆，通过设置 startAngle 和 endAngle，还可以绘制圆弧
   * @param x 椭圆圆心的 x 坐标
   * @param y 椭圆圆心的 y 坐标
   * @param radiusX 椭圆水平半径
   * @param radiusY 椭圆垂直半径
   * @param startAngle 开始的弧度
   * @param endAngle 结束的弧度
   */
  ellipse(x: number, y: number, radiusX: number, radiusY: number, startAngle = 0, endAngle = PI2): this {
    this.pp.cmd.push({
      type: "ellipse",
      params: [x, y, radiusX, radiusY, 0, startAngle, endAngle],
    });
    this._$addPoint(x - radiusX, y - radiusY);
    this._$addPoint(x + radiusX, y + radiusY);
    return this;
  }

  /**
   * 绘制图片、canvas 或者 Texture
   * @param image  图片、canvas 或者 Texture
   * @param dx 绘制到的目标 x 轴位置
   * @param dy 绘制到的目标 y 轴位置
   * @param dw 绘制到的目标宽度
   * @param dh 绘制到的目标高度
   * @param sx 相对原图的 x 轴偏移，实现绘制一部分
   * @param sy 相对原图的 y 轴偏移，实现绘制一部分
   * @param sw 相对原图的宽度，实现绘制一部分
   * @param sh 相对原图的高度，实现绘制一部分
   */
  image(
    image: HTMLImageElement | HTMLCanvasElement | Texture,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number,
    sx?: number,
    sy?: number,
    sw?: number,
    sh?: number,
  ): this {
    const source = image instanceof Texture ? (image.buffer as TextureBuffer).bitmap : image;
    const width = dw ?? image.width;
    const height = dh ?? image.height;
    // biome-ignore lint/style/noArguments: <explanation>
    const { length } = arguments;
    if (length === 3) {
      this.pp.cmd.push({ type: "drawImage", params: [source, dx, dy] });
    } else if (length === 5) {
      this.pp.cmd.push({ type: "drawImage", params: [source, dx, dy, dw, dh] });
    } else if (length === 9) {
      this.pp.cmd.push({ type: "drawImage", params: [source, sx, sy, sw, sh, dx, dy, dw, dh] });
    } else {
      throw new Error("arguments length error");
    }

    this._$addPoint(dx, dy);
    this._$addPoint(dx + width, dy + height);

    return this;
  }

  /**
   * 绘制 svg
   * @param svgStr svg 字符串
   * @param dx 绘制到的目标 x 轴位置
   * @param dy 绘制到的目标 y 轴位置
   * @param scale 缩放值
   */
  svg(svgStr: string, dx = 0, dy = 0, scale = 1): this {
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.onerror = () => {
      throw new Error('svg内容错误，检查是否包含 xmlns="http://www.w3.org/2000/svg" 的定义');
    };
    img.onload = () => {
      const width = img.width * scale;
      const height = img.height * scale;
      this.pp.cmd.push({ type: "drawImage", params: [img, dx, dy, width, height] });
      this._$addPoint(dx, dy);
      this._$addPoint(dx + width, dy + height);

      this.pp.changed = true;
    };

    return this;
  }

  /**
   * 移动绘制起点到某点
   * @param x 绘制起点 x 坐标
   * @param y 绘制起点 y 坐标
   */
  moveTo(x: number, y: number): this {
    this.pp.cmd.push({ type: "moveTo", params: [x, y] });
    this._$addPoint(x, y);
    return this;
  }

  /**
   * 绘制线段到某点
   * @param x 线段终点 x 坐标
   * @param y 线段终点 y 坐标
   */
  lineTo(x: number, y: number): this {
    this.pp.cmd.push({ type: "lineTo", params: [x, y] });
    this._$addPoint(x, y);
    return this;
  }

  /**
   * 绘制圆弧
   * @param x 圆弧圆心的 x 坐标
   * @param y 圆弧圆心的 y 坐标
   * @param radius 圆弧半径
   * @param startAngle 开始的弧度
   * @param endAngle 结束的弧度
   */
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): this {
    this.pp.cmd.push({ type: "arc", params: [x, y, radius, startAngle, endAngle] });
    this._$addPoint(x - radius, y - radius);
    this._$addPoint(x + radius, y + radius);
    return this;
  }

  /**
   * 根据两个控制点，绘制圆弧
   * @param x1 控制点1的 x 坐标
   * @param y1 控制点1的 y 坐标
   * @param x2 控制点2的 x 坐标
   * @param y2 控制点2的 y 坐标
   * @param radius 圆弧半径
   */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
    this.pp.cmd.push({ type: "arcTo", params: [x1, y1, x2, y2, radius] });
    this._$addPoint(x1, y1);
    this._$addPoint(x2, y2);
    return this;
  }

  /**
   * 绘制二次贝塞尔曲线，起点是当前路径最后落点，cpx 和 cpy 是控制点，x，y 是终点
   * @param cpx 控制点 x 坐标
   * @param cpy 控制点 y 坐标
   * @param x 终点 x 坐标
   * @param y 终点 y 坐标
   */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.pp.cmd.push({ type: "quadraticCurveTo", params: [cpx, cpy, x, y] });
    this._$addPoint(x, y);
    this._$addPoint(cpx, cpy);
    return this;
  }

  /**
   * 绘制三次贝塞尔曲线，起点是当前路径最后落点，有两个控制点，x，y 是终点
   * @param cp1x 控制点1的 x 坐标
   * @param cp1y 控制点1的 y 坐标
   * @param cp2x 控制点2的 x 坐标
   * @param cp2y 控制点2的 y 坐标
   * @param x 终点 x 坐标
   * @param y 终点 y 坐标
   */
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.pp.cmd.push({ type: "bezierCurveTo", params: [cp1x, cp1y, cp2x, cp2y, x, y] });
    this._$addPoint(x, y);
    this._$addPoint(cp2x, cp2y);
    this._$addPoint(cp2x, cp2y);
    return this;
  }

  /**
   * 开始路径绘制，自定义闭环路径绘制的时候，需要调用 beginPath和 closePath
   */
  beginPath(): this {
    this.pp.cmd.push({ type: "beginPath", params: [] });
    return this;
  }

  /**
   * 闭合路径绘制，自定义闭环路径绘制的时候，需要调用 beginPath和 closePath
   */
  closePath(): this {
    this.pp.cmd.push({ type: "closePath", params: [] });
    return this;
  }

  /**
   * 裁剪
   * @param path 裁剪路径
   */
  clip(path?: Path2D) {
    this.pp.cmd.push({ type: "clip", params: path ? [path] : [] });
  }

  /**
   * 判断某点是否在适量图形内部
   * @param pos 世界坐标
   */
  isPointInPath(pos: { x: number; y: number }) {
    // TODO:需要考虑 pixelRatio
    const p = this.toLocalPoint(pos);
    return this.pp.ctx.isPointInPath(p.x, p.y);
  }

  /**
   * 填充颜色
   */
  fill(options: { color: string | CanvasGradient | CanvasPattern }): this {
    this.pp.cmd.push({ type: "fill", params: [options.color] });
    this.pp.changed = true;
    return this;
  }

  private _$fill(color: string | CanvasGradient | CanvasPattern) {
    this.pp.ctx.fillStyle = color;
    this.pp.ctx.fill();
  }

  /**
   * 绘制描边线条
   */
  stroke(options: {
    color: string | CanvasGradient | CanvasPattern;
    width?: number;
    cap?: CanvasLineCap;
    join?: CanvasLineJoin;
    dash?: number[];
    dashOffset?: number;
    miterLimit?: number;
  }): this {
    if (options.width && options.width > this.pp.maxLineWidth) {
      // TODO 这里需要优化
      // this.pp.maxLineWidth = options.width;
      this.pp.maxLineWidth = 0;
    }
    this.pp.cmd.push({
      type: "stroke",
      params: [
        options.color,
        options.width,
        options.cap,
        options.join,
        options.dash,
        options.dashOffset,
        options.miterLimit,
      ],
    });
    this.pp.changed = true;
    if (options.width) {
      // 这里需要考虑描边宽度
      this.pp.bounds.pad(0.5 * options.width);
    }
    return this;
  }

  private _$stroke(
    color: string | CanvasGradient | CanvasPattern,
    width?: number,
    cap?: CanvasLineCap,
    join?: CanvasLineJoin,
    dash?: number[],
    dashOffset?: number,
    miterLimit?: number,
  ) {
    const ctx = this.pp.ctx;
    ctx.strokeStyle = color;
    if (width) ctx.lineWidth = width;
    if (cap) ctx.lineCap = cap;
    if (join) ctx.lineJoin = join;
    if (dash) ctx.setLineDash(dash);
    if (dashOffset) ctx.lineDashOffset = dashOffset;
    if (miterLimit) ctx.miterLimit = miterLimit;

    ctx.stroke();
  }

  private _$drawCanvas() {
    const pp = this.pp;
    if (pp.changed) {
      pp.changed = false;
      this.onDirty(DirtyType.texture);
      if (pp.cmd.length) {
        // 根据 bounds，重置画布大小
        this._$resizeCanvas();

        // 开始绘制
        // TODO 为啥必须用 reset
        pp.ctx.reset();
        pp.ctx.scale(App.pixelRatio, App.pixelRatio);
        // 确保正确应用 offset
        pp.ctx.translate(-pp.offset.x, -pp.offset.y);
        for (const cmd of pp.cmd) {
          if (cmd.type === "fill") {
            this._$fill.apply(this, cmd.params);
          } else if (cmd.type === "stroke") {
            this._$stroke.apply(this, cmd.params);
          } else {
            const fun = (CanvasRenderingContext2D.prototype as any)[cmd.type];
            fun.apply(pp.ctx, cmd.params);
          }
        }
      }
    }
  }

  private _$resizeCanvas() {
    const pp = this.pp;

    // 根据 bounds，重置画布大小
    const bounds = this.getLocalBounds();
    const { width, height } = bounds;
    const scale = App.pixelRatio;

    // 根据线宽，留出一部分余地
    const linePadding = pp.maxLineWidth ? pp.maxLineWidth / 2 + 1 : 0;
    // 修正 offset 计算，确保所有内容都在可视区域内
    const offsetX = bounds.minX - linePadding;
    const offsetY = bounds.minY - linePadding;
    pp.offset.set(offsetX, offsetY);

    const scaleWidth = width * scale;
    const scaleHeight = height * scale;
    // 根据pixelRatio计算出新的宽高
    const canvasWidth = Math.ceil(scaleWidth + linePadding * 2 * scale);
    const canvasHeight = Math.ceil(scaleHeight + linePadding * 2 * scale);

    const sheet = {
      // 裁剪后的小图在图集上的位置和大小
      frame: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
      // 裁剪后的图，在原图片的位置和大小
      spriteSourceSize: { x: offsetX * scale, y: offsetY * scale, w: scaleWidth, h: scaleHeight },
      // 原图大小（包含空白）
      sourceSize: { w: scaleWidth, h: scaleHeight },
      rotated: false,
      trimmed: true,
    };

    // 根据画布大小，创建 Texture
    const canvas = pp.canvas;
    if (canvasWidth > canvas.width || canvasHeight > canvas.height || pp.texture === Texture.BLANK) {
      if (pp.texture === Texture.BLANK) pp.texture = new Texture();
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      pp.texture.set(new TextureBuffer(canvas), undefined, sheet);
    } else {
      pp.texture.set(pp.texture.buffer, undefined, sheet);
      // 宽高不变，重新更新 Texture 的图片
      pp.texture.buffer.dirty();
    }
  }

  private _$addPoint(x: number, y: number) {
    const bounds = this.pp.bounds;
    if (x < bounds.minX) bounds.minX = x;
    if (x > bounds.maxX) bounds.maxX = x;
    if (y < bounds.minY) bounds.minY = y;
    if (y > bounds.maxY) bounds.maxY = y;
  }

  protected override _customLocalBounds(bounds: Bounds) {
    const b = this.pp.bounds;
    bounds.addFrame(b.minX, b.minY, b.maxX, b.maxY);
  }

  getLocalBounds(): Bounds {
    // 获取 bounds 之前，先绘制
    if (this.pp.changed) this._$drawCanvas();
    return super.getLocalBounds();
  }

  getWorldBounds(): Bounds {
    // 获取 bounds 之前，先绘制
    if (this.pp.changed) this._$drawCanvas();
    return super.getWorldBounds();
  }
}
