import { TextureBuffer } from "../render/buffer/texture-buffer";
import { type ISheet, Texture } from "../resource/texture";
import { getPathRoot } from "../utils/utils";
import type { ILoader, LoaderManager } from "./loader-manager";

/**
 * 图集加载器
 */
export class SheetLoader implements ILoader {
  map: Record<string, boolean> = { atlas: true, sheet: true };

  test(type: string): boolean {
    if (this.map[type]) return true;
    return false;
  }

  async load(url: string, manager: LoaderManager) {
    const res = await fetch(url);
    const json = await res.json();

    // 加载图片
    const rootPath = getPathRoot(url);
    const imageUrl = rootPath + json.meta.image;
    const imageRes = await fetch(imageUrl);
    const bitmap = await createImageBitmap(await imageRes.blob());
    const buffer = new TextureBuffer(bitmap);

    // 创建 Texture
    const sheets: Record<string, ISheet> = json.frames;
    const keys = Object.keys(sheets);
    const count = keys.length;
    const textures: Texture[] = [];
    for (let i = 0; i < count; i++) {
      const key = keys[i];
      const sheet = sheets[key];
      const texture = Texture.create(buffer, rootPath + key, sheet);

      // 防止重名
      manager.cache(rootPath + texture.url, texture);
      textures.push(texture);
    }
    return textures;
  }
}
