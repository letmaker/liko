import { loader } from "../loader";
import { Rectangle } from "../math/rectangle";
import type { ITextureBuffer } from "../render/buffer/interface";
import { RenderTargetBuffer } from "../render/buffer/render-target-buffer";
import { groupD8 } from "../render/utils/groupD8";
import { getUID } from "../utils/utils";

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
 * 纹理 = source + uv
 */
export class Texture {
  private static _blank?: Texture;
  static get BLANK() {
    if (!Texture._blank) {
      Texture._blank = new Texture().set(new RenderTargetBuffer(10, 10));
    }
    return Texture._blank;
  }

  readonly uid = getUID();
  readonly uvs = { x0: 0, y0: 0, x1: 1, y1: 0, x2: 1, y2: 1, x3: 0, y3: 1 };

  /** url 地址 */
  url = "";

  private _buffer?: ITextureBuffer;
  private _width = 0;
  private _height = 0;
  private _destroyed = false;
  private _trimmed = false;
  private _trim: Rectangle = new Rectangle();
  private _sheet?: ISheet;

  /** Texture 的宽度 */
  get width() {
    return this._width;
  }

  /** Texture 的高度 */
  get height() {
    return this._height;
  }

  get trim() {
    return this._trim;
  }

  get trimmed() {
    return this._trimmed;
  }

  get sheet() {
    return this._sheet;
  }

  /** 是否销毁 */
  get destroyed() {
    return this._destroyed;
  }

  /** Texture 的 buffer 数据 */
  get buffer(): ITextureBuffer {
    return this._buffer as ITextureBuffer;
  }

  /**
   * 从 url 地址创建一个新的 Texture
   * @param url url 地址
   * @returns 新的 Texture
   */
  static async from(url: string): Promise<Texture> {
    return loader.load(url, "image");
  }

  static create(buffer: ITextureBuffer, url: string, sheet?: ISheet): Texture {
    return new Texture().set(buffer, url, sheet);
  }

  set(buffer: ITextureBuffer, url?: string, sheet?: ISheet) {
    if (this._buffer !== buffer) {
      this._buffer?.destroy();
      this._buffer = buffer;
      this._sheet = sheet;
      this.url = url ?? "";
    }
    if (sheet) {
      this._width = sheet.sourceSize.w;
      this._height = sheet.sourceSize.h;
      this._trimmed = sheet.trimmed;
      this._trim.set(
        sheet.spriteSourceSize.x,
        sheet.spriteSourceSize.y,
        // 修复 adobe 导出显示异常
        sheet.spriteSourceSize.x + sheet.frame.w,
        sheet.spriteSourceSize.y + sheet.frame.h,
      );
      this._updateUvs(sheet);
    } else {
      this._width = buffer.width;
      this._height = buffer.height;
      this._trimmed = false;
      this._trim.set(0, 0, buffer.width, buffer.height);
    }
    return this;
  }

  private _updateUvs(sheet: ISheet) {
    const { uvs } = this;
    const { frame } = sheet;
    const { width, height } = this.buffer;

    const nX = frame.x / width;
    const nY = frame.y / height;
    const nW = frame.w / width;
    const nH = frame.h / height;

    let rotate = 0;

    if (rotate) {
      // width and height div 2 div baseFrame size
      const w2 = nW / 2;
      const h2 = nH / 2;

      // coordinates of center
      const cX = nX + w2;
      const cY = nY + h2;

      rotate = groupD8.add(rotate, groupD8.NW); // NW is top-left corner
      uvs.x0 = cX + w2 * groupD8.uX(rotate);
      uvs.y0 = cY + h2 * groupD8.uY(rotate);

      rotate = groupD8.add(rotate, 2); // rotate 90 degrees clockwise
      uvs.x1 = cX + w2 * groupD8.uX(rotate);
      uvs.y1 = cY + h2 * groupD8.uY(rotate);

      rotate = groupD8.add(rotate, 2);
      uvs.x2 = cX + w2 * groupD8.uX(rotate);
      uvs.y2 = cY + h2 * groupD8.uY(rotate);

      rotate = groupD8.add(rotate, 2);
      uvs.x3 = cX + w2 * groupD8.uX(rotate);
      uvs.y3 = cY + h2 * groupD8.uY(rotate);
    } else {
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
   * 销毁纹理
   */
  destroy() {
    if (!this._destroyed) {
      this._destroyed = true;
      this._buffer?.destroy();
      this._buffer = undefined;
    }
  }
}
