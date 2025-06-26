import { App } from '../app';
import { DirtyType, PI2 } from '../const';
import { Bounds } from '../math/bounds';
import type { IPoint } from '../math/point';
import { TextureBuffer } from '../render/buffer/texture-buffer';
import { SpriteObject } from '../render/render/sprite-object';
import { Texture } from '../resource/texture';
import { RegNode } from '../utils/decorators';
import { Timer } from '../utils/timer';
import { createCanvas } from '../utils/utils';
import type { INodeOptions, INodePrivateProps } from './node';
import { LikoNode } from './node';
import type { IRenderable } from './sprite';

/** 颜色数据类型，可以是字符串、Canvas 渐变或 Canvas 图案 */
type ColorData = string | CanvasGradient | CanvasPattern;
/** 图像源类型，可以是 HTML 图像元素、HTML Canvas 元素或纹理 */
type ImageSource = HTMLImageElement | HTMLCanvasElement | Texture;

interface ICanvasPrivateProps extends INodePrivateProps {
  bounds: Bounds;
  cmd: Array<{ type: string; params: unknown }>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: Texture;
  changed: boolean;
  maxLineWidth: number;
  clipped: boolean;
}

/**
 * Canvas 矢量图形绘制类，提供类似 Canvas 2D API 的绘制功能
 *
 * 对比 Shape 类，Canvas 类使用 CPU 渲染，功能更齐全，抗锯齿效果更好，但频繁更新时性能较差。
 * Shape 类使用 GPU 渲染，性能更好，但功能相对有限。
 *
 * **适用场景：**
 * - 不经常变化且对视觉效果有更高要求的图形
 * - 需要复杂路径绘制、渐变填充、图案填充的场景
 * - 需要精确像素级控制的绘制
 *
 * **注意事项：**
 * 1. 所有绘制命令都是延迟执行的，只有在需要纹理时才会实际渲染到画布
 * 2. 连续调用 fill() 或 stroke() 时，建议手动调用 beginPath() 来避免路径自动闭合
 * 3. 使用裁剪功能后，边界计算会被禁用，需要手动管理边界
 *
 * **基本使用示例：**
 * ```typescript
 * // 创建 Canvas 实例
 * const canvas = new Canvas();
 *
 * // 绘制填充矩形
 * canvas.rect(10, 10, 100, 50)
 *       .fill({ color: 'red' });
 *
 * // 绘制描边圆形
 * canvas.circle(60, 35, 25)
 *       .stroke({ color: '#00FF00', width: 2 });
 *
 * // 绘制复杂路径
 * canvas.beginPath()
 *       .moveTo(10, 100)
 *       .lineTo(50, 120)
 *       .quadraticCurveTo(80, 100, 110, 120)
 *       .stroke({ color: '#0000FF', width: 3 });
 *
 * // 绘制渐变填充
 * const gradient = utils.createLinearGradient({ startX: 0, startY: 0, endX: 100, endY: 0 }, [
 *   { offset: 0, color: 'red' },
 *   { offset: 1, color: 'blue' },
 * ]);
 * canvas.rect(10, 150, 100, 30)
 *       .fill({ color: gradient });
 * ```
 *
 * **链式调用示例：**
 * ```typescript
 * canvas.beginPath()
 *       .rect(0, 0, 100, 100)
 *       .circle(50, 50, 30)
 *       .fill({ color: '#FFD700' })
 *       .stroke({ color: '#FF0000', width: 2 });
 * ```
 */
@RegNode('Canvas')
export class Canvas extends LikoNode implements IRenderable {
  declare pp: ICanvasPrivateProps;
  readonly renderObject: SpriteObject = new SpriteObject(this);

  constructor(options?: INodeOptions) {
    super(options);

    const pp = this.pp;
    pp.bounds = new Bounds();
    pp.cmd = [];
    pp.canvas = createCanvas(1, 1);
    pp.ctx = pp.canvas.getContext('2d') as CanvasRenderingContext2D;
    pp.texture = Texture.createFromCanvas(pp.canvas);
    pp.changed = false;
    pp.maxLineWidth = 0;
    pp.clipped = false;

    // document.body.appendChild(pp.canvas);
  }

  /** 获取渲染纹理对象，在需要时自动更新画布内容 */
  get texture(): Texture {
    if (this.pp.cmd.length === 0) return Texture.BLANK;
    if (this.pp.changed) this._$drawCanvas();
    return this.pp.texture;
  }

  /**
   * 清理所有绘制命令和画布内容
   * @returns 当前实例，支持链式调用
   */
  clear(): this {
    const pp = this.pp;
    pp.cmd.length = 0;
    pp.bounds.reset();
    pp.ctx.clearRect(0, 0, pp.canvas.width, pp.canvas.height);
    pp.maxLineWidth = 0;
    pp.clipped = false;
    this._$dirty();
    return this;
  }

  /**
   * 绘制矩形路径
   * @param x - 左上角的 x 坐标
   * @param y - 左上角的 y 坐标
   * @param width - 矩形宽度
   * @param height - 矩形高度
   * @returns 当前实例，支持链式调用
   */
  rect(x: number, y: number, width: number, height: number): this {
    console.assert(width >= 0 && height >= 0);
    this.pp.cmd.push({ type: 'rect', params: [x, y, width, height] });
    this._$addPoint(x, y);
    this._$addPoint(x + width, y + height);
    return this;
  }

  /**
   * 绘制圆角矩形路径
   * @param x - 左上角的 x 坐标
   * @param y - 左上角的 y 坐标
   * @param width - 矩形宽度
   * @param height - 矩形高度
   * @param radii - 圆角半径，可以是单个数值或多个值
   * @returns 当前实例，支持链式调用
   */
  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radii?: number | DOMPointInit | (number | DOMPointInit)[]
  ): this {
    this.pp.cmd.push({ type: 'roundRect', params: [x, y, width, height, radii] });
    this._$addPoint(x, y);
    this._$addPoint(x + width, y + height);
    return this;
  }

  /**
   * 绘制圆形路径
   * @param centerX - 圆心的 x 坐标
   * @param centerY - 圆心的 y 坐标
   * @param radius - 圆的半径
   * @returns 当前实例，支持链式调用
   */
  circle(centerX: number, centerY: number, radius: number): this {
    this.pp.cmd.push({ type: 'arc', params: [centerX, centerY, radius, 0, PI2] });
    this._$addPoint(centerX - radius, centerY - radius);
    this._$addPoint(centerX + radius, centerY + radius);
    return this;
  }

  /**
   * 绘制椭圆路径或圆弧
   *
   * 通过设置 startAngle 和 endAngle，还可以绘制圆弧
   * @param centerX - 椭圆圆心的 x 坐标
   * @param centerY - 椭圆圆心的 y 坐标
   * @param radiusX - 椭圆水平半径
   * @param radiusY - 椭圆垂直半径
   * @param startAngle - 开始角度（弧度）
   * @param endAngle - 结束角度（弧度）
   * @returns 当前实例，支持链式调用
   */
  ellipse(centerX: number, centerY: number, radiusX: number, radiusY: number, startAngle = 0, endAngle = PI2): this {
    this.pp.cmd.push({
      type: 'ellipse',
      params: [centerX, centerY, radiusX, radiusY, 0, startAngle, endAngle],
    });
    this._$addPoint(centerX - radiusX, centerY - radiusY);
    this._$addPoint(centerX + radiusX, centerY + radiusY);
    return this;
  }

  /**
   * 绘制多边形路径
   * @param points - 多边形顶点坐标数组
   * @returns 当前实例，支持链式调用
   */
  polygon(points: IPoint[]): this {
    this.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        this.moveTo(points[i].x, points[i].y);
      } else {
        this.lineTo(points[i].x, points[i].y);
      }
    }
    this.closePath();
    return this;
  }

  /**
   * 移动绘制起点到指定位置
   * @param x - 目标点的 x 坐标
   * @param y - 目标点的 y 坐标
   * @returns 当前实例，支持链式调用
   */
  moveTo(x: number, y: number): this {
    this.pp.cmd.push({ type: 'moveTo', params: [x, y] });
    this._$addPoint(x, y);
    return this;
  }

  /**
   * 从当前位置绘制线段到指定位置
   * @param x - 目标点的 x 坐标
   * @param y - 目标点的 y 坐标
   * @returns 当前实例，支持链式调用
   */
  lineTo(x: number, y: number): this {
    this.pp.cmd.push({ type: 'lineTo', params: [x, y] });
    this._$addPoint(x, y);
    return this;
  }

  /**
   * 绘制圆弧路径
   * @param x - 圆弧圆心的 x 坐标
   * @param y - 圆弧圆心的 y 坐标
   * @param radius - 圆弧半径
   * @param startAngle - 开始角度（弧度）
   * @param endAngle - 结束角度（弧度）
   * @returns 当前实例，支持链式调用
   */
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): this {
    this.pp.cmd.push({ type: 'arc', params: [x, y, radius, startAngle, endAngle] });
    this._$addPoint(x - radius, y - radius);
    this._$addPoint(x + radius, y + radius);
    return this;
  }

  /**
   * 根据两个控制点绘制圆弧路径
   * @param x1 - 控制点 1 的 x 坐标
   * @param y1 - 控制点 1 的 y 坐标
   * @param x2 - 控制点 2 的 x 坐标
   * @param y2 - 控制点 2 的 y 坐标
   * @param radius - 圆弧半径
   * @returns 当前实例，支持链式调用
   */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
    this.pp.cmd.push({ type: 'arcTo', params: [x1, y1, x2, y2, radius] });
    this._$addPoint(x1, y1);
    this._$addPoint(x2, y2);
    return this;
  }

  /**
   * 绘制二次贝塞尔曲线路径
   *
   * 起点是当前路径最后落点，cpx 和 cpy 是控制点，x 和 y 是终点
   * @param cpx - 控制点的 x 坐标
   * @param cpy - 控制点的 y 坐标
   * @param x - 终点的 x 坐标
   * @param y - 终点的 y 坐标
   * @returns 当前实例，支持链式调用
   */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.pp.cmd.push({ type: 'quadraticCurveTo', params: [cpx, cpy, x, y] });
    this._$addPoint(x, y);
    this._$addPoint(cpx, cpy);
    return this;
  }

  /**
   * 绘制三次贝塞尔曲线路径
   *
   * 起点是当前路径最后落点，有两个控制点，x 和 y 是终点
   * @param cp1x - 控制点 1 的 x 坐标
   * @param cp1y - 控制点 1 的 y 坐标
   * @param cp2x - 控制点 2 的 x 坐标
   * @param cp2y - 控制点 2 的 y 坐标
   * @param x - 终点的 x 坐标
   * @param y - 终点的 y 坐标
   * @returns 当前实例，支持链式调用
   */
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.pp.cmd.push({ type: 'bezierCurveTo', params: [cp1x, cp1y, cp2x, cp2y, x, y] });
    this._$addPoint(x, y);
    this._$addPoint(cp1x, cp1y);
    this._$addPoint(cp2x, cp2y);
    return this;
  }

  /**
   * 开始一个新的路径
   *
   * 注意：连续调用 fill 或者 stroke 绘制多个图案叠加时，需要手动调用 beginPath，否则会自动闭合路径，导致图案叠加不正确
   *
   * 绘制闭环路径时，需要调用 beginPath 和 closePath
   * @returns 当前实例，支持链式调用
   */
  beginPath(): this {
    this.pp.cmd.push({ type: 'beginPath', params: [] });
    return this;
  }

  /**
   * 闭合当前路径
   * @returns 当前实例，支持链式调用
   */
  closePath(): this {
    this.pp.cmd.push({ type: 'closePath', params: [] });
    return this;
  }

  /**
   * 创建裁剪区域
   * @param path - 可选的 Path2D 对象
   * @returns 当前实例，支持链式调用
   */
  clip(path?: Path2D): this {
    this.pp.cmd.push({ type: 'clip', params: path ? [path] : [] });
    this.pp.clipped = true;
    return this;
  }

  /**
   * 绘制完整图像
   * @param image - 图片、canvas 或 Texture 对象
   * @param x - 目标 x 坐标
   * @param y - 目标 y 坐标
   * @returns 当前实例，支持链式调用
   */
  drawImage(image: ImageSource, x: number, y: number): this;
  /**
   * 绘制缩放后的图像
   * @param image - 图片、canvas 或 Texture 对象
   * @param x - 目标 x 坐标
   * @param y - 目标 y 坐标
   * @param width - 目标宽度
   * @param height - 目标高度
   * @returns 当前实例，支持链式调用
   */
  drawImage(image: ImageSource, x: number, y: number, width: number, height: number): this;
  /**
   * 绘制图像的指定部分到指定位置
   * @param image - 图片、canvas 或 Texture 对象
   * @param x - 目标 x 坐标
   * @param y - 目标 y 坐标
   * @param destWidth - 目标宽度
   * @param destHeight - 目标高度
   * @param sourceX - 源图像裁剪的 x 坐标
   * @param sourceY - 源图像裁剪的 y 坐标
   * @param sourceWidth - 源图像裁剪的宽度
   * @param sourceHeight - 源图像裁剪的高度
   * @returns 当前实例，支持链式调用
   */
  drawImage(
    image: ImageSource,
    x: number,
    y: number,
    destWidth?: number,
    destHeight?: number,
    sourceX?: number,
    sourceY?: number,
    sourceWidth?: number,
    sourceHeight?: number
  ): this {
    const source = image instanceof Texture ? (image.buffer as TextureBuffer).bitmap : image;
    const width = destWidth ?? image.width;
    const height = destHeight ?? image.height;

    // 根据参数判断调用方式
    const { cmd } = this.pp;
    if (sourceX !== undefined && sourceY !== undefined && sourceWidth !== undefined && sourceHeight !== undefined) {
      // 9 参数版本：绘制图像的指定部分到指定位置
      cmd.push({
        type: 'drawImage',
        params: [source, sourceX, sourceY, sourceWidth, sourceHeight, x, y, destWidth, destHeight],
      });
    } else if (destWidth !== undefined && destHeight !== undefined) {
      // 5 参数版本：绘制缩放后的图像
      cmd.push({ type: 'drawImage', params: [source, x, y, destWidth, destHeight] });
    } else {
      // 3 参数版本：绘制完整图像
      cmd.push({ type: 'drawImage', params: [source, x, y] });
    }

    this._$addPoint(x, y);
    this._$addPoint(x + width, y + height);

    return this;
  }

  /**
   * 绘制 SVG 图像
   * @param svgStr - SVG 字符串
   * @param destX - 目标 x 坐标
   * @param destY - 目标 y 坐标
   * @param scale - 缩放比例
   * @returns 当前实例，支持链式调用
   */
  drawSvg(svgStr: string, destX = 0, destY = 0, scale = 1): this {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.onerror = () => {
      throw new Error('SVG 内容错误，检查是否包含 xmlns="http://www.w3.org/2000/svg" 的定义');
    };
    img.onload = () => {
      const width = img.width * scale;
      const height = img.height * scale;
      this.pp.cmd.push({ type: 'drawImage', params: [img, destX, destY, width, height] });
      this._$addPoint(destX, destY);
      this._$addPoint(destX + width, destY + height);

      this._$dirty();
    };

    return this;
  }

  /**
   * 填充当前路径
   * @param options - 填充选项
   * @returns 当前实例，支持链式调用
   */
  fill(options?: { color: ColorData }): this {
    this.pp.cmd.push({ type: 'fill', params: [options?.color ?? '#FFD700'] });
    this._$dirty();
    return this;
  }

  private _$fill(color: ColorData) {
    const { ctx } = this.pp;
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * 绘制当前路径的描边
   * @param options - 描边选项
   * @returns 当前实例，支持链式调用
   */
  stroke(options?: {
    color?: ColorData;
    width?: number;
    cap?: CanvasLineCap;
    join?: CanvasLineJoin;
    dash?: number[];
    dashOffset?: number;
    miterLimit?: number;
  }): this {
    const params = options ? { width: 1, color: '#FFD700', ...options } : { width: 1, color: '#FFD700' };
    params.width = Math.max(params.width, 0.0001);
    this.pp.cmd.push({
      type: 'stroke',
      params: [params.color, params.width, params.cap, params.join, params.dash, params.dashOffset, params.miterLimit],
    });

    if (params.width) {
      this.pp.maxLineWidth = Math.max(this.pp.maxLineWidth, params.width);
    }

    this._$dirty();
    return this;
  }

  private _$stroke(
    color: ColorData,
    width: number,
    cap?: CanvasLineCap,
    join?: CanvasLineJoin,
    dash?: number[],
    dashOffset?: number,
    miterLimit?: number
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
    const { changed, canvas, ctx, cmd, maxLineWidth, bounds } = this.pp;
    if (changed) {
      this.pp.changed = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (cmd.length) {
        const { width, height } = bounds;
        const scale = App.pixelRatio;
        const canvasWidth = Math.ceil((width + maxLineWidth) * scale);
        const canvasHeight = Math.ceil((height + maxLineWidth) * scale);
        const offset = { x: bounds.x - maxLineWidth * 0.5, y: bounds.y - maxLineWidth * 0.5 };

        // 重置画布大小
        this._$resizeCanvas(offset, canvasWidth, canvasHeight);

        ctx.reset();
        // ctx.resetTransform();
        ctx.scale(scale, scale);
        // 确保正确应用 offset
        ctx.translate(-offset.x, -offset.y);

        for (const c of cmd) {
          if (c.type === 'fill') {
            this._$fill.apply(this, c.params as [ColorData]);
          } else if (c.type === 'stroke') {
            this._$stroke.apply(
              this,
              c.params as [ColorData, number, CanvasLineCap?, CanvasLineJoin?, number[]?, number?, number?]
            );
          } else {
            const fun = (CanvasRenderingContext2D.prototype as unknown as Record<string, (...args: unknown[]) => void>)[
              c.type
            ];
            fun.apply(ctx, c.params as unknown[]);
          }
        }
      }
    }
  }

  private _$resizeCanvas(offset: IPoint, canvasWidth: number, canvasHeight: number) {
    console.assert(canvasWidth > 0 && canvasHeight > 0, 'canvas width and height must be greater than 0');
    const { canvas, texture, width, height } = this.pp;

    const sheet = {
      // 裁剪后的小图在图集上的位置和大小
      frame: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
      // 裁剪后的图，在原图片的位置和大小
      spriteSourceSize: { x: offset.x * App.pixelRatio, y: offset.y * App.pixelRatio, w: canvasWidth, h: canvasHeight },
      // 原图大小（包含空白）
      sourceSize: { w: canvasWidth, h: canvasHeight },
      rotated: false,
      trimmed: true,
    };

    if (canvasWidth > canvas.width || canvasHeight > canvas.height) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      texture.setBuffer(new TextureBuffer(canvas), undefined, sheet);
      this.markDirty(DirtyType.child);
    } else {
      texture.setBuffer(texture.buffer, undefined, sheet);
      // 宽高不变，重新更新 Texture 的图片
      texture.buffer.dirty();
    }

    // 适应轴心点变化
    if (width === -1 && height === -1) {
      this.pp.boundsDirty = true;
      this.anchor = this.anchor;
    }
  }

  private _$addPoint(x: number, y: number) {
    if (this.pp.clipped) return;

    const { bounds } = this.pp;
    if (x < bounds.minX) bounds.minX = x;
    if (x > bounds.maxX) bounds.maxX = x;
    if (y < bounds.minY) bounds.minY = y;
    if (y > bounds.maxY) bounds.maxY = y;
  }

  protected override _customLocalBounds(bounds: Bounds) {
    const { bounds: b, maxLineWidth } = this.pp;
    const offset = maxLineWidth * 0.5;
    bounds.addFrame(b.minX - offset, b.minY - offset, b.maxX + offset, b.maxY + offset);
  }

  private _$dirty() {
    if (this.pp.changed) return;

    this.pp.changed = true;
    this.markDirty(DirtyType.transform);
    this.markDirty(DirtyType.texture);
    this.markDirty(DirtyType.size);
    Timer.callLater(this._$drawCanvas, this);
  }

  /**
   * 判断某点是否在矢量图形内部
   * @param position - 世界坐标点
   * @returns 点是否在路径内
   */
  isPointInPath(position: { x: number; y: number }): boolean {
    // TODO: 需要考虑 pixelRatio
    const p = this.worldToLocal(position);
    return this.pp.ctx.isPointInPath(p.x, p.y);
  }

  /**
   * 销毁 Canvas 实例及其资源
   */
  override destroy(): void {
    this.pp.cmd.length = 0;
    this.pp.texture?.destroy();
    super.destroy();
  }
}
