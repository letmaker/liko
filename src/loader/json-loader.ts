import type { ILoader } from "./loader-manager";

/**
 * JSON 加载器，用于加载和解析 JSON 格式的资源文件
 * @implements {ILoader}
 */
export class JsonLoader implements ILoader {
  /** 支持的文件类型映射表 */
  map: Record<string, boolean> = { json: true, scene: true };

  /**
   * 测试是否支持指定的文件类型
   * @param type - 文件类型
   * @returns 是否支持该类型
   */
  test(type: string): boolean {
    return !!this.map[type];
  }

  /**
   * 加载并解析 JSON 文件
   * @param url - 文件 URL 地址
   * @returns 解析后的 JSON 对象，加载失败时返回 undefined
   */
  async load(url: string) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      console.error(`Error loading JSON from ${url}:`, e);
      return undefined;
    }
  }
}
