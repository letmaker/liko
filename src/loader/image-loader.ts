import { TextureBuffer } from '../render/buffer/texture-buffer';
import { Texture } from '../resource/texture';
import type { ILoader } from './loader-manager';

/**
 * 图片资源加载器
 * 用于加载并处理各种图片格式，将其转换为游戏引擎可用的纹理资源
 */
export class ImageLoader implements ILoader {
  /** 支持的图片格式映射表 */
  map: Record<string, boolean> = { png: true, jpg: true, jpeg: true, webp: true, image: true };

  /**
   * 测试给定类型是否被此加载器支持
   * @param type - 资源类型字符串
   * @returns 如果支持该类型则返回true，否则返回false
   */
  test(type: string): boolean {
    return !!this.map[type];
  }

  /**
   * 加载指定URL的图片资源
   * @param url - 图片资源的URL地址
   * @returns 加载成功时返回Texture对象，失败时返回undefined
   */
  async load(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob);
      return Texture.createFormBuffer(new TextureBuffer(bitmap), url);
    } catch (e) {
      console.error(`Error loading image from ${url}:`, e);
      return undefined;
    }
  }
}
