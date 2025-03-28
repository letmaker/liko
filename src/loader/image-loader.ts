import { TextureBuffer } from "../render/buffer/texture-buffer";
import { Texture } from "../resource/texture";
import type { ILoader } from "./loader-manager";

/**
 * 图片加载器
 */
export class ImageLoader implements ILoader {
  map: Record<string, boolean> = { png: true, jpg: true, jpeg: true, image: true };

  test(type: string): boolean {
    return this.map[type];
  }

  async load(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    return Texture.create(new TextureBuffer(bitmap), url);
  }
}
