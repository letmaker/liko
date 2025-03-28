import type { ILoader } from "./loader-manager";

/**
 * Json 加载器
 */
export class JsonLoader implements ILoader {
  map: Record<string, boolean> = { json: true, scene: true };

  test(type: string): boolean {
    return this.map[type];
  }

  async load(url: string) {
    const res = await fetch(url);
    return await res.json();
  }
}
