import { system } from '../utils/system';
import type { ILoader } from './loader-manager';

/**
 * Text 加载器，用于加载和解析 Text 格式的资源文件
 * @implements {ILoader}
 */
export class TextLoader implements ILoader {
  /** 支持的文件类型映射表 */
  map: Record<string, boolean> = { text: true, plist: true };

  /**
   * 测试是否支持指定的文件类型
   * @param type - 文件类型
   * @returns 是否支持该类型
   */
  test(type: string): boolean {
    return !!this.map[type];
  }

  /**
   * 加载并解析 Text 文件
   * @param url - 文件 URL 地址
   * @returns 解析后的 Text 对象，加载失败时返回 undefined
   */
  async load(url: string) {
    try {
      return await system.loadText(url);
    } catch (e) {
      console.error(`Error loading Text from ${url}:`, e);
      return undefined;
    }
  }
}
