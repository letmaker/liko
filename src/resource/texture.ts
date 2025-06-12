import { loader } from '../loader';
import { Rectangle } from '../math/rectangle';
import type { ITextureBuffer } from '../render/buffer/interface';
import { RenderTargetBuffer } from '../render/buffer/render-target-buffer';
import { TextureBuffer } from '../render/buffer/texture-buffer';
import { groupD8 } from '../render/utils/groupD8';
import { getUID } from '../utils/utils';

/**
 * 图集信息接口，描述纹理在图集中的位置和变换信息
 */
export interface ISheet {
  /** 裁剪后的小图在图集上的位置和大小 */
  frame: { x: number; y: number; w: number; h: number };
  /** 裁剪后的图，在原图片的位置和大小 */
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  /** 原图大小（包含空白） */
  sourceSize: { w: number; h: number };
  /** 是否旋转 */
  rotated: boolean;
  /** 是否裁剪 */
  trimmed: boolean;
}

/**
 * 纹理类，由图像源和 UV 坐标组成，用于在渲染中表示和管理纹理资源
 *
 * 纹理是渲染系统的核心组件，它封装了图像数据和相关的渲染属性。
 * 支持从多种来源创建纹理，包括 URL、Canvas 元素和现有的缓冲区。
 * 同时支持图集纹理，可以处理旋转、裁剪等复杂的纹理变换。
 *
 * @example
 * ```typescript
 * // 从 URL 创建纹理
 * const texture = await Texture.createFromUrl('path/to/image.png');
 *
 * // 从 Canvas 创建纹理
 * const canvas = document.createElement('canvas');
 * // ... 在 canvas 上绘制内容
 * const canvasTexture = Texture.createFromCanvas(canvas);
 *
 * // 使用预定义的纹理
 * const whiteTexture = Texture.WHITE; // 白色纹理
 * const blankTexture = Texture.BLANK; // 空纹理
 *
 * // 从缓冲区创建带图集信息的纹理
 * const atlasTexture = Texture.createFormBuffer(buffer, 'atlas.png', sheetInfo);
 *
 * // 销毁纹理释放资源
 * texture?.destroy();
 * ```
 */
export class Texture {
  private static _blank?: Texture;
  private static _white?: Texture;

  /**
   * 空纹理，用于占位或默认纹理
   * @returns 1x1 的透明纹理实例
   */
  static get BLANK() {
    if (!Texture._blank) {
      Texture._blank = new Texture().setBuffer(new RenderTargetBuffer(1, 1));
    }
    return Texture._blank;
  }

  /**
   * 白色纹理，专用于形状渲染和纯色填充
   * @returns 1x1 的白色纹理实例
   */
  static get WHITE() {
    if (!Texture._white) {
      // 创建一个1x1的白色画布
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1, 1);

      Texture._white = Texture.createFromCanvas(canvas);
    }
    return Texture._white;
  }

  /**
   * 纹理的唯一标识符，每个纹理实例都有独一无二的 ID
   * @readonly
   */
  readonly uid = getUID();

  /**
   * UV 坐标集合，用于纹理映射到几何体表面
   * 包含四个顶点的纹理坐标 (x0,y0), (x1,y1), (x2,y2), (x3,y3)
   * @readonly
   */
  readonly uvs = { x0: 0, y0: 0, x1: 1, y1: 0, x2: 1, y2: 1, x3: 0, y3: 1 };

  /**
   * 纹理的 URL 地址，标识纹理的来源
   */
  url = '';

  private _buffer?: ITextureBuffer;
  private _width = 0;
  private _height = 0;
  private _destroyed = false;
  private _trimmed = false;
  private _rotated = false;
  private _trimRect: Rectangle = new Rectangle();
  private _sheet?: ISheet;

  /**
   * 纹理是否启用重复填充模式
   * @returns 如果纹理支持重复则返回 true，否则返回 false
   */
  get repeat(): boolean {
    return this._buffer?.repeat ?? false;
  }

  /**
   * 纹理的宽度（像素），对于图集纹理，返回的是原始图片的宽度（包含空白区域）
   */
  get width(): number {
    return this._width;
  }

  /**
   * 纹理的高度（像素），对于图集纹理，返回的是原始图片的高度（包含空白区域）
   */
  get height(): number {
    return this._height;
  }

  /**
   * 纹理的图集信息，包含纹理在图集中的位置、大小、变换等详细信息
   * @returns 图集信息对象，如果不是图集纹理则返回 undefined
   */
  get sheet(): ISheet | undefined {
    return this._sheet;
  }

  /**
   * 纹理的裁剪区域
   * 表示有效像素在原始图片中的位置和范围
   * @returns 裁剪区域的矩形对象
   */
  get trimRect(): Rectangle {
    return this._trimRect;
  }

  /**
   * 纹理是否被裁剪，图集打包时可能会裁剪掉透明边缘以节省空间
   */
  get trimmed(): boolean {
    return this._trimmed;
  }

  /**
   * 纹理是否被旋转，图集打包时可能会旋转纹理以更好地利用空间
   */
  get rotated(): boolean {
    return this._rotated;
  }

  /**
   * 纹理是否已被销毁
   * 销毁后的纹理不能再使用，访问其属性可能导致错误
   * @returns 如果纹理已销毁则返回 true
   */
  get destroyed(): boolean {
    return this._destroyed;
  }

  /**
   * 纹理的缓冲数据
   * 包含实际的图像数据和渲染相关的属性
   * @returns 纹理缓冲对象
   */
  get buffer(): ITextureBuffer {
    return this._buffer as ITextureBuffer;
  }

  /**
   * 从 URL 地址异步创建纹理
   *
   * @param url - 图像资源的 URL 地址，支持相对路径和绝对路径
   * @returns Promise，成功时返回纹理对象，失败时返回 undefined
   *
   * 注意事项：
   * - 这是一个异步方法，需要等待图像加载完成
   * - 如果图像加载失败，会返回 undefined
   * - 支持的图像格式取决于浏览器支持
   */
  static async createFromUrl(url: string): Promise<Texture | undefined> {
    return loader.load(url, 'image');
  }

  /**
   * 从 HTMLCanvasElement 创建纹理
   *
   * @param canvas - 画布元素，必须是有效的 HTMLCanvasElement
   * @returns 创建的纹理对象
   *
   * 注意事项：
   * - Canvas 必须已经绘制了内容
   * - 纹理会捕获当前 Canvas 的状态，后续 Canvas 的修改不会影响纹理
   */
  static createFromCanvas(canvas: HTMLCanvasElement): Texture {
    return new Texture().setBuffer(new TextureBuffer(canvas));
  }

  /**
   * 使用已有的缓冲数据创建纹理
   *
   * @param buffer - 纹理缓冲数据，包含图像数据和渲染属性
   * @param url - 可选的纹理 URL 地址，用于标识纹理来源
   * @param sheet - 可选的图集信息，用于图集纹理
   * @returns 创建的纹理对象
   *
   * 注意事项：
   * - 如果提供了 sheet 参数，纹理将被视为图集纹理
   * - sheet 信息会影响纹理的 UV 坐标计算
   */
  static createFormBuffer(buffer: ITextureBuffer, url?: string, sheet?: ISheet): Texture {
    return new Texture().setBuffer(buffer, url, sheet);
  }

  /**
   * 设置纹理的缓冲数据和属性
   *
   * @param buffer - 纹理缓冲数据
   * @param url - 可选的纹理 URL 地址
   * @param sheet - 可选的图集信息
   * @returns 当前纹理实例，支持链式调用
   *
   * 注意事项：
   * - 如果设置了新的缓冲区，旧的缓冲区会被自动销毁
   * - 设置图集信息会重新计算 UV 坐标
   * - 支持运行时动态更换纹理内容
   */
  setBuffer(buffer: ITextureBuffer, url?: string, sheet?: ISheet) {
    if (this._buffer !== buffer) {
      this._buffer?.destroy();
      this._buffer = buffer;
      this._sheet = sheet;
      this.url = url ?? '';
    }
    if (sheet) {
      this._width = sheet.sourceSize.w;
      this._height = sheet.sourceSize.h;
      this._trimmed = sheet.trimmed;
      this._rotated = sheet.rotated;
      this._trimRect.set(
        sheet.spriteSourceSize.x,
        sheet.spriteSourceSize.y,
        // 修复 adobe 导出显示异常
        sheet.spriteSourceSize.x + sheet.frame.w,
        sheet.spriteSourceSize.y + sheet.frame.h
      );
      this._updateUvs(sheet);
    } else {
      this._width = buffer.width;
      this._height = buffer.height;
      this._trimmed = false;
      this._rotated = false;
      this._trimRect.set(0, 0, buffer.width, buffer.height);
    }
    return this;
  }

  /**
   * 根据图集信息更新纹理的 UV 坐标
   */
  private _updateUvs(sheet: ISheet) {
    const { uvs, _rotated } = this;
    const { frame } = sheet;
    const { width, height } = this.buffer;

    const nX = frame.x / width;
    const nY = frame.y / height;
    const nW = (_rotated ? frame.h : frame.w) / width;
    const nH = (_rotated ? frame.w : frame.h) / height;

    if (_rotated) {
      let rotate = 2;

      // 计算宽度和高度的一半
      const w2 = nW / 2;
      const h2 = nH / 2;

      // 计算中心坐标
      const cX = nX + w2;
      const cY = nY + h2;

      // 初始旋转值
      rotate = groupD8.add(rotate, groupD8.NW); // 左上角为起点
      uvs.x0 = cX + w2 * groupD8.uX(rotate);
      uvs.y0 = cY + h2 * groupD8.uY(rotate);

      rotate = groupD8.add(rotate, 2); // 顺时针旋转 90 度
      uvs.x1 = cX + w2 * groupD8.uX(rotate);
      uvs.y1 = cY + h2 * groupD8.uY(rotate);

      rotate = groupD8.add(rotate, 2); // 顺时针旋转 90 度
      uvs.x2 = cX + w2 * groupD8.uX(rotate);
      uvs.y2 = cY + h2 * groupD8.uY(rotate);

      rotate = groupD8.add(rotate, 2); // 顺时针旋转 90 度
      uvs.x3 = cX + w2 * groupD8.uX(rotate);
      uvs.y3 = cY + h2 * groupD8.uY(rotate);
    } else {
      // 不旋转时直接设置 UV 坐标
      uvs.x0 = nX;
      uvs.y0 = nY;
      uvs.x1 = nX + nW;
      uvs.y1 = nY;
      uvs.x2 = nX + nW;
      uvs.y2 = nY + nH;
      uvs.x3 = nX;
      uvs.y3 = nY + nH;
    }
  }

  /**
   * 销毁纹理，释放相关资源
   *
   * 注意事项：
   * - 调用此方法后，纹理将不再可用
   * - 多次调用是安全的，不会产生副作用
   * - 销毁后访问纹理属性可能导致错误
   * - 静态纹理（BLANK、WHITE）不应该被手动销毁
   */
  destroy() {
    if (this === Texture.BLANK || this === Texture.WHITE) return;
    if (!this._destroyed) {
      this._destroyed = true;
      this._buffer?.destroy();
      this._buffer = undefined;
    }
  }
}
