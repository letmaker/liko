import { TextureBuffer } from '../render/buffer/texture-buffer';
import { type ISheet, Texture } from '../resource/texture';
import { getPathRoot } from '../utils/utils';
import type { ILoader, LoaderManager } from './loader-manager';

interface ISheetData {
  frames: Record<string, ISheet>;
  meta: { image: string };
}

/**
 * 图集加载器
 * 用于加载和处理图集(sprite sheet)资源
 */
export class SheetLoader implements ILoader {
  /** 支持的资源类型映射 */
  map: Record<string, boolean> = { atlas: true, sheet: true };

  /**
   * 测试是否支持指定的资源类型
   * @param type - 资源类型
   * @returns 如果支持该类型则返回true，否则返回false
   */
  test(type: string): boolean {
    return !!this.map[type];
  }

  /**
   * 加载图集资源
   * @param url - 图集JSON文件的URL
   * @param manager - 加载器管理器实例
   * @returns 加载的纹理数组，如果加载失败则返回undefined
   */
  async load(url: string, manager: LoaderManager) {
    try {
      const res = await fetch(url);
      const json = (await res.json()) as ISheetData;

      // 加载图集图片
      const rootPath = getPathRoot(url);
      const imageUrl = rootPath + json.meta.image;
      const imageRes = await fetch(imageUrl);
      const bitmap = await createImageBitmap(await imageRes.blob());
      const buffer = new TextureBuffer(bitmap);

      // 创建并缓存纹理
      const sheets: Record<string, ISheet> = json.frames;
      const keys = Object.keys(sheets);
      const count = keys.length;
      const textures: Texture[] = [];
      for (let i = 0; i < count; i++) {
        const key = keys[i];
        const sheet = sheets[key];
        const path = rootPath + key;
        const texture = Texture.createFormBuffer(buffer, path, sheet);

        manager.cache(path, texture);
        textures.push(texture);
      }
      textures.sort((a, b) => {
        const numA = getNumber(a.url);
        const numB = getNumber(b.url);
        return numA - numB;
      });
      return textures;
    } catch (e) {
      console.error(`Error loading sheet from ${url}:`, e);
      return undefined;
    }
  }
}

function getNumber(url: string) {
  const match = url.match(/\d+/);
  return match ? Number.parseInt(match[0]) : 0;
}
