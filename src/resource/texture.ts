import { loader } from '../loader';
import { Rectangle } from '../math/rectangle';
import type { ITextureBuffer } from '../render/buffer/interface';
import { groupD8 } from '../render/utils/groupD8';
import { getUID } from '../utils/utils';

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
 * 纹理类，由图像源和 UV 坐标组成
 */
export class Texture {
  /** 唯一标识符 */
  readonly uid = getUID();
  /** UV 坐标集合，用于纹理映射 */
  readonly uvs = { x0: 0, y0: 0, x1: 1, y1: 0, x2: 1, y2: 1, x3: 0, y3: 1 };

  /** 纹理的 URL 地址 */
  url = '';

  private _buffer?: ITextureBuffer;
  private _width = 0;
  private _height = 0;
  private _destroyed = false;
  private _trimmed = false;
  private _rotated = false;
  private _trim: Rectangle = new Rectangle();
  private _sheet?: ISheet;

  /** 纹理的宽度 */
  get width() {
    return this._width;
  }

  /** 纹理的高度 */
  get height() {
    return this._height;
  }

  /** 纹理是否被裁剪 */
  get trimmed() {
    return this._trimmed;
  }

  /** 纹理是否被旋转 */
  get rotated() {
    return this._rotated;
  }

  /** 纹理的图集信息 */
  get sheet() {
    return this._sheet;
  }

  /** 纹理的裁剪区域 */
  get trim() {
    return this._trim;
  }

  /** 纹理是否已销毁 */
  get destroyed() {
    return this._destroyed;
  }

  /** 纹理的缓冲数据 */
  get buffer(): ITextureBuffer {
    return this._buffer as ITextureBuffer;
  }

  /**
   * 从 URL 地址创建一个新的纹理
   * @param url - 图像资源的 URL 地址
   * @returns 创建的纹理对象，如果加载失败则返回 undefined
   */
  static async createFromUrl(url: string): Promise<Texture | undefined> {
    return loader.load(url, 'image');
  }

  /**
   * 使用已有的缓冲数据创建纹理
   * @param buffer - 纹理缓冲数据
   * @param url - 纹理的 URL 地址
   * @param sheet - 可选的图集信息
   * @returns 创建的纹理对象
   */
  static createFormBuffer(buffer: ITextureBuffer, url?: string, sheet?: ISheet): Texture {
    return new Texture().setBuffer(buffer, url, sheet);
  }

  /**
   * 设置纹理的缓冲数据和属性
   * @param buffer - 纹理缓冲数据
   * @param url - 可选的纹理 URL 地址
   * @param sheet - 可选的图集信息
   * @returns 当前纹理实例，用于链式调用
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
      this._trim.set(
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
      this._trim.set(0, 0, buffer.width, buffer.height);
    }
    return this;
  }

  /**
   * 根据图集信息更新纹理的 UV 坐标
   * @param sheet - 图集信息
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
   * 销毁纹理，释放相关资源，调用此方法后，纹理将不再可用
   */
  destroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      this._buffer?.destroy();
      this._buffer = undefined;
    }
  }
}
